const { StatusCodes } = require('http-status-codes');
const { pool } = require('../config/db');
const AppError = require('../utils/appError');
const { toPublicUser } = require('../utils/user');
const { sendEmail } = require('../utils/email');

/**
 * Get all users with filtering and pagination
 */
const getAllUsers = async (filters = {}) => {
    const {
        role,
        isActive,
        isVerified,
        search,
        page = 1,
        limit = 10,
    } = filters;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (role) {
        whereConditions.push(`"role" = $${paramIndex}`);
        queryParams.push(role);
        paramIndex++;
    }

    if (isActive !== undefined) {
        whereConditions.push(`"isActive" = $${paramIndex}`);
        queryParams.push(isActive);
        paramIndex++;
    }

    if (isVerified !== undefined) {
        whereConditions.push(`"isVerified" = $${paramIndex}`);
        queryParams.push(isVerified);
        paramIndex++;
    }

    if (search) {
        whereConditions.push(
            `("fullName" ILIKE $${paramIndex} OR "email" ILIKE $${paramIndex})`
        );
        queryParams.push(`%${search}%`);
        paramIndex++;
    }

    const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM "User" ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalUsers = parseInt(countResult.rows[0].count);

    // Calculate pagination
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(totalUsers / limit);

    // Get paginated users (exclude password)
    const usersQuery = `
    SELECT 
      "id", "email", "fullName", "phone", "profileImage", "timezone",
      "role", "isActive", "isVerified", "isEmailVerified",
      "lastLoginAt", "loginCount", "emailNotifications", "smsNotifications",
      "createdAt", "updatedAt"
    FROM "User"
    ${whereClause}
    ORDER BY "createdAt" DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

    queryParams.push(limit, offset);
    const usersResult = await pool.query(usersQuery, queryParams);

    return {
        users: usersResult.rows,
        pagination: {
            currentPage: page,
            totalPages,
            totalUsers,
            limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
};

/**
 * Get user by ID with role-specific statistics
 */
const getUserById = async (userId) => {
    // Get user details
    const userResult = await pool.query(
        `SELECT 
      "id", "email", "fullName", "phone", "profileImage", "timezone",
      "role", "isActive", "isVerified", "isEmailVerified",
      "lastLoginAt", "loginCount", "emailNotifications", "smsNotifications",
      "createdAt", "updatedAt"
    FROM "User"
    WHERE "id" = $1`,
        [userId]
    );

    const user = userResult.rows[0];

    if (!user) {
        throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    let statistics = {};

    // Get role-specific statistics
    if (user.role === 'CUSTOMER') {
        // Get booking count and total spend
        const statsResult = await pool.query(
            `SELECT 
        COUNT(b."id") as "bookingCount",
        COALESCE(SUM(p."amount"), 0) as "totalSpend"
      FROM "Booking" b
      LEFT JOIN "Payment" p ON b."id" = p."bookingId" AND p."status" = 'SUCCESS'
      WHERE b."customerId" = $1`,
            [userId]
        );

        statistics = {
            bookingCount: parseInt(statsResult.rows[0].bookingCount) || 0,
            totalSpend: parseFloat(statsResult.rows[0].totalSpend) || 0,
        };
    } else if (user.role === 'ORGANISER') {
        // Get services created, bookings received, and revenue
        const servicesResult = await pool.query(
            `SELECT COUNT(*) as "servicesCreated"
      FROM "AppointmentType"
      WHERE "organizerId" = $1`,
            [userId]
        );

        const bookingsResult = await pool.query(
            `SELECT 
        COUNT(b."id") as "bookingsReceived",
        COALESCE(SUM(p."amount"), 0) as "totalRevenue"
      FROM "Booking" b
      JOIN "AppointmentType" at ON b."appointmentTypeId" = at."id"
      LEFT JOIN "Payment" p ON b."id" = p."bookingId" AND p."status" = 'SUCCESS'
      WHERE at."organizerId" = $1`,
            [userId]
        );

        statistics = {
            servicesCreated: parseInt(servicesResult.rows[0].servicesCreated) || 0,
            bookingsReceived: parseInt(bookingsResult.rows[0].bookingsReceived) || 0,
            totalRevenue: parseFloat(bookingsResult.rows[0].totalRevenue) || 0,
        };
    }

    return {
        user,
        statistics,
    };
};

/**
 * Toggle user active status
 */
const toggleUserStatus = async (userId, isActive) => {
    // Check if user exists
    const userResult = await pool.query(
        'SELECT * FROM "User" WHERE "id" = $1',
        [userId]
    );

    const user = userResult.rows[0];

    if (!user) {
        throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    // Prevent deactivating yourself (if admin is deactivating themselves)
    // This check can be added if needed with the current admin's ID

    // Update user status
    const updatedUserResult = await pool.query(
        `UPDATE "User"
    SET "isActive" = $1, "updatedAt" = NOW()
    WHERE "id" = $2
    RETURNING "id", "email", "fullName", "role", "isActive"`,
        [isActive, userId]
    );

    const updatedUser = updatedUserResult.rows[0];

    // If deactivating an organiser, handle their bookings
    if (!isActive && user.role === 'ORGANISER') {
        // Get all pending/confirmed bookings for this organiser's services
        await pool.query(
            `UPDATE "Booking"
      SET "status" = 'CANCELLED', 
          "cancellationReason" = 'Organiser account deactivated',
          "cancelledAt" = NOW(),
          "updatedAt" = NOW()
      WHERE "appointmentTypeId" IN (
        SELECT "id" FROM "AppointmentType" WHERE "organizerId" = $1
      )
      AND "status" IN ('PENDING', 'CONFIRMED')`,
            [userId]
        );
    }

    // Send notification email
    const statusText = isActive ? 'activated' : 'deactivated';
    await sendEmail({
        to: user.email,
        subject: `Account ${statusText} - Odoo Appointment Booking`,
        text: `Your account has been ${statusText} by an administrator.`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Account ${statusText}</h2>
        <p>Hi <strong>${user.fullName}</strong>,</p>
        <p>Your account has been ${statusText} by an administrator.</p>
        ${!isActive
                ? '<p>If you believe this is a mistake, please contact support.</p>'
                : '<p>You can now access your account normally.</p>'
            }
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Best regards,<br>Odoo Appointment Booking Team</p>
      </div>
    `,
    });

    return {
        message: `User ${statusText} successfully`,
        user: updatedUser,
    };
};

/**
 * Change user role
 */
const changeUserRole = async (userId, newRole, performedByUserId) => {
    // Check if user exists
    const userResult = await pool.query(
        'SELECT * FROM "User" WHERE "id" = $1',
        [userId]
    );

    const user = userResult.rows[0];

    if (!user) {
        throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    // Prevent changing your own role
    if (userId === performedByUserId) {
        throw new AppError(
            'You cannot change your own role',
            StatusCodes.BAD_REQUEST
        );
    }

    // Check if role is actually changing
    if (user.role === newRole) {
        throw new AppError(
            `User already has role ${newRole}`,
            StatusCodes.BAD_REQUEST
        );
    }

    // Update user role
    const updatedUserResult = await pool.query(
        `UPDATE "User"
    SET "role" = $1, "updatedAt" = NOW()
    WHERE "id" = $2
    RETURNING "id", "email", "fullName", "role", "isActive"`,
        [newRole, userId]
    );

    const updatedUser = updatedUserResult.rows[0];

    // Send notification email
    await sendEmail({
        to: user.email,
        subject: 'Account Role Changed - Odoo Appointment Booking',
        text: `Your account role has been changed from ${user.role} to ${newRole} by an administrator.`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Account Role Changed</h2>
        <p>Hi <strong>${user.fullName}</strong>,</p>
        <p>Your account role has been changed by an administrator.</p>
        <p><strong>Previous Role:</strong> ${user.role}</p>
        <p><strong>New Role:</strong> ${newRole}</p>
        <p>Please log in again to access your new role features.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Best regards,<br>Odoo Appointment Booking Team</p>
      </div>
    `,
    });

    return {
        message: 'User role changed successfully',
        user: updatedUser,
    };
};

/**
 * Get dashboard statistics
 */
const getDashboardStats = async () => {
    // Get user statistics
    const userStatsResult = await pool.query(`
    SELECT 
      COUNT(*) as "totalUsers",
      COUNT(*) FILTER (WHERE "role" = 'CUSTOMER') as "totalCustomers",
      COUNT(*) FILTER (WHERE "role" = 'ORGANISER') as "totalOrganisers",
      COUNT(*) FILTER (WHERE "role" = 'ADMIN') as "totalAdmins",
      COUNT(*) FILTER (WHERE "createdAt" >= DATE_TRUNC('month', CURRENT_DATE)) as "newThisMonth"
    FROM "User"
  `);

    const userStats = userStatsResult.rows[0];

    // Get appointment statistics
    const appointmentStatsResult = await pool.query(`
    SELECT 
      COUNT(*) as "totalAppointments",
      COUNT(*) FILTER (WHERE "status" = 'COMPLETED') as "completedAppointments",
      COUNT(*) FILTER (WHERE "status" = 'CONFIRMED' AND "startTime" > NOW()) as "upcomingAppointments",
      COUNT(*) FILTER (WHERE "status" = 'CANCELLED') as "cancelledAppointments",
      COUNT(*) FILTER (WHERE "status" = 'PENDING') as "pendingAppointments"
    FROM "Booking"
  `);

    const appointmentStats = appointmentStatsResult.rows[0];

    // Get revenue statistics
    const revenueStatsResult = await pool.query(`
    SELECT 
      COALESCE(SUM("amount"), 0) as "totalRevenue",
      COALESCE(SUM("amount") FILTER (WHERE "createdAt" >= DATE_TRUNC('month', CURRENT_DATE)), 0) as "revenueThisMonth",
      COALESCE(SUM("amount") FILTER (WHERE "createdAt" >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
        AND "createdAt" < DATE_TRUNC('month', CURRENT_DATE)), 0) as "revenueLastMonth"
    FROM "Payment"
    WHERE "status" = 'SUCCESS'
  `);

    const revenueStats = revenueStatsResult.rows[0];

    // Calculate revenue growth percentage
    const revenueThisMonth = parseFloat(revenueStats.revenueThisMonth) || 0;
    const revenueLastMonth = parseFloat(revenueStats.revenueLastMonth) || 0;
    let revenueGrowth = 0;

    if (revenueLastMonth > 0) {
        revenueGrowth = ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;
    } else if (revenueThisMonth > 0) {
        revenueGrowth = 100; // 100% growth if last month was 0
    }

    // Get top organisers
    const topOrganisersResult = await pool.query(`
    SELECT 
      u."id",
      u."fullName" as "name",
      u."email",
      COUNT(b."id") as "bookingCount",
      COALESCE(SUM(p."amount"), 0) as "revenue"
    FROM "User" u
    JOIN "AppointmentType" at ON u."id" = at."organizerId"
    JOIN "Booking" b ON at."id" = b."appointmentTypeId"
    LEFT JOIN "Payment" p ON b."id" = p."bookingId" AND p."status" = 'SUCCESS'
    WHERE u."role" = 'ORGANISER'
    GROUP BY u."id", u."fullName", u."email"
    ORDER BY "revenue" DESC
    LIMIT 5
  `);

    const topOrganisers = topOrganisersResult.rows.map((org) => ({
        id: org.id,
        name: org.name,
        email: org.email,
        bookings: parseInt(org.bookingCount) || 0,
        revenue: parseFloat(org.revenue) || 0,
    }));

    return {
        users: {
            total: parseInt(userStats.totalUsers) || 0,
            customers: parseInt(userStats.totalCustomers) || 0,
            organisers: parseInt(userStats.totalOrganisers) || 0,
            admins: parseInt(userStats.totalAdmins) || 0,
            newThisMonth: parseInt(userStats.newThisMonth) || 0,
        },
        appointments: {
            total: parseInt(appointmentStats.totalAppointments) || 0,
            completed: parseInt(appointmentStats.completedAppointments) || 0,
            upcoming: parseInt(appointmentStats.upcomingAppointments) || 0,
            cancelled: parseInt(appointmentStats.cancelledAppointments) || 0,
            pending: parseInt(appointmentStats.pendingAppointments) || 0,
        },
        revenue: {
            total: parseFloat(revenueStats.totalRevenue) || 0,
            thisMonth: revenueThisMonth,
            lastMonth: revenueLastMonth,
            growth: parseFloat(revenueGrowth.toFixed(2)),
        },
        topOrganisers,
    };
};

/**
 * Get all appointments (system-wide)
 */
const getAllAppointments = async (filters = {}) => {
    const {
        status,
        organizerId,
        customerId,
        startDate,
        endDate,
        page = 1,
        limit = 10,
    } = filters;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (status) {
        whereConditions.push(`b."status" = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
    }

    if (organizerId) {
        whereConditions.push(`at."organizerId" = $${paramIndex}`);
        queryParams.push(organizerId);
        paramIndex++;
    }

    if (customerId) {
        whereConditions.push(`b."customerId" = $${paramIndex}`);
        queryParams.push(customerId);
        paramIndex++;
    }

    if (startDate) {
        whereConditions.push(`b."startTime" >= $${paramIndex}`);
        queryParams.push(startDate);
        paramIndex++;
    }

    if (endDate) {
        whereConditions.push(`b."startTime" <= $${paramIndex}`);
        queryParams.push(endDate);
        paramIndex++;
    }

    const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
    SELECT COUNT(*) 
    FROM "Booking" b
    JOIN "AppointmentType" at ON b."appointmentTypeId" = at."id"
    ${whereClause}
  `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalAppointments = parseInt(countResult.rows[0].count);

    // Calculate pagination
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(totalAppointments / limit);

    // Get paginated appointments
    const appointmentsQuery = `
    SELECT 
      b."id",
      b."date",
      b."startTime",
      b."endTime",
      b."status",
      b."customerEmail",
      b."customerPhone",
      b."venue",
      b."notes",
      b."createdAt",
      at."id" as "appointmentTypeId",
      at."title" as "appointmentTitle",
      at."organizerId",
      c."fullName" as "customerName",
      c."email" as "customerEmailFromUser",
      o."fullName" as "organiserName",
      o."email" as "organiserEmail",
      sm."name" as "staffMemberName",
      r."name" as "resourceName",
      p."amount" as "paymentAmount",
      p."status" as "paymentStatus"
    FROM "Booking" b
    JOIN "AppointmentType" at ON b."appointmentTypeId" = at."id"
    JOIN "User" c ON b."customerId" = c."id"
    JOIN "User" o ON at."organizerId" = o."id"
    LEFT JOIN "StaffMember" sm ON b."staffMemberId" = sm."id"
    LEFT JOIN "Resource" r ON b."resourceId" = r."id"
    LEFT JOIN "Payment" p ON b."id" = p."bookingId"
    ${whereClause}
    ORDER BY b."startTime" DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

    queryParams.push(limit, offset);
    const appointmentsResult = await pool.query(appointmentsQuery, queryParams);

    return {
        appointments: appointmentsResult.rows,
        pagination: {
            currentPage: page,
            totalPages,
            totalAppointments,
            limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
};

module.exports = {
    getAllUsers,
    getUserById,
    toggleUserStatus,
    changeUserRole,
    getDashboardStats,
    getAllAppointments,
};
