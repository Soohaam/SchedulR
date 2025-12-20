const { StatusCodes } = require('http-status-codes');
const { pool } = require('../config/db');
const AppError = require('../utils/appError');
const crypto = require('crypto');

/**
 * Create a new staff member
 */
const createStaffMember = async (organizerId, data) => {
  const { name, email, phone, title, specialization, description, profileImage, workingHours } = data;

  if (!name || !email) {
    throw new AppError('Name and Email are required', StatusCodes.BAD_REQUEST);
  }

  // Check if email already exists for this organiser
  const existingStaffResult = await pool.query(
    'SELECT * FROM "StaffMember" WHERE "organizerId" = $1 AND "email" = $2',
    [organizerId, email]
  );

  if (existingStaffResult.rows.length > 0) {
    throw new AppError(
      'A staff member with this email already exists in your organization',
      StatusCodes.CONFLICT
    );
  }

  // Generate ID manually
  const newId = crypto.randomUUID();

  // Create staff member
  const staffMemberResult = await pool.query(
    `INSERT INTO "StaffMember" 
      ("id", "name", "email", "phone", "title", "specialization", "description", "profileImage", "organizerId", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, NOW(), NOW())
     RETURNING *`,
    [
      newId,
      name,
      email,
      phone || null,
      title || null,
      specialization || null,
      description || null,
      profileImage || null,
      organizerId
    ]
  );

  const staffMember = staffMemberResult.rows[0];

  // Create working hours if provided
  if (workingHours && workingHours.length > 0) {
    for (const wh of workingHours) {
      if (wh.isWorking) {
        await pool.query(
          `INSERT INTO "WorkingHours" 
            ("staffMemberId", "dayOfWeek", "isWorking", "startTime", "endTime", "breakStart", "breakEnd", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT ("staffMemberId", "dayOfWeek") DO UPDATE
           SET "isWorking" = EXCLUDED."isWorking",
               "startTime" = EXCLUDED."startTime",
               "endTime" = EXCLUDED."endTime",
               "breakStart" = EXCLUDED."breakStart",
               "breakEnd" = EXCLUDED."breakEnd",
               "updatedAt" = NOW()`,
          [staffMember.id, wh.dayOfWeek, wh.isWorking, wh.startTime || null, wh.endTime || null, wh.breakStart || null, wh.breakEnd || null]
        );
      }
    }
  }

  return {
    id: staffMember.id,
    name: staffMember.name,
    email: staffMember.email,
    phone: staffMember.phone,
    title: staffMember.title,
    specialization: staffMember.specialization,
    description: staffMember.description,
    profileImage: staffMember.profileImage,
    isActive: staffMember.isActive,
    organizerId: staffMember.organizerId,
    createdAt: staffMember.createdAt,
    updatedAt: staffMember.updatedAt,
  };
};

/**
 * List all staff members for an organiser with filters and pagination
 */
const listStaffMembers = async (organizerId, filters) => {
  const { page = 1, limit = 10, search, isActive, specialization } = filters;
  const offset = (page - 1) * limit;

  // Build query with filters
  let whereConditions = ['"organizerId" = $1'];
  let queryParams = [organizerId];
  let paramIndex = 2;

  if (search) {
    whereConditions.push(`("name" ILIKE $${paramIndex} OR "email" ILIKE $${paramIndex})`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  if (isActive !== undefined) {
    whereConditions.push(`"isActive" = $${paramIndex}`);
    queryParams.push(isActive === 'true');
    paramIndex++;
  }

  if (specialization) {
    whereConditions.push(`"specialization" ILIKE $${paramIndex}`);
    queryParams.push(`%${specialization}%`);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM "StaffMember" WHERE ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  // Get paginated data
  const dataResult = await pool.query(
    `SELECT "id", "name", "email", "phone", "title", "specialization", "description", "profileImage", "isActive", "createdAt", "updatedAt"
     FROM "StaffMember"
     WHERE ${whereClause}
     ORDER BY "createdAt" DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...queryParams, limit, offset]
  );

  return {
    data: dataResult.rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single staff member details with working hours and statistics
 */
const getStaffMemberById = async (organizerId, staffMemberId) => {
  // Get staff member
  const staffResult = await pool.query(
    'SELECT * FROM "StaffMember" WHERE "id" = $1 AND "organizerId" = $2',
    [staffMemberId, organizerId]
  );

  if (staffResult.rows.length === 0) {
    throw new AppError('Staff member not found', StatusCodes.NOT_FOUND);
  }

  const staffMember = staffResult.rows[0];

  // Get working hours
  const workingHoursResult = await pool.query(
    'SELECT "id", "dayOfWeek", "isWorking", "startTime", "endTime", "breakStart", "breakEnd" FROM "WorkingHours" WHERE "staffMemberId" = $1 ORDER BY "dayOfWeek"',
    [staffMemberId]
  );

  // Get availability exceptions
  const exceptionsResult = await pool.query(
    'SELECT "id", "date", "isAvailable", "startTime", "endTime", "reason" FROM "AvailabilityException" WHERE "staffMemberId" = $1 AND "date" >= CURRENT_DATE ORDER BY "date"',
    [staffMemberId]
  );

  // Get booking statistics
  const totalBookingsResult = await pool.query(
    'SELECT COUNT(*) FROM "Booking" WHERE "staffMemberId" = $1',
    [staffMemberId]
  );

  const upcomingBookingsResult = await pool.query(
    'SELECT COUNT(*) FROM "Booking" WHERE "staffMemberId" = $1 AND "startTime" >= NOW() AND "status" != $2',
    [staffMemberId, 'CANCELLED']
  );

  const completedBookingsResult = await pool.query(
    'SELECT COUNT(*) FROM "Booking" WHERE "staffMemberId" = $1 AND "status" = $2',
    [staffMemberId, 'COMPLETED']
  );

  const averageRatingResult = await pool.query(
    `SELECT AVG("rating") as "averageRating" 
     FROM "Review" r
     INNER JOIN "Booking" b ON r."bookingId" = b."id"
     WHERE b."staffMemberId" = $1`,
    [staffMemberId]
  );

  return {
    id: staffMember.id,
    name: staffMember.name,
    email: staffMember.email,
    phone: staffMember.phone,
    title: staffMember.title,
    specialization: staffMember.specialization,
    description: staffMember.description,
    profileImage: staffMember.profileImage,
    isActive: staffMember.isActive,
    organizerId: staffMember.organizerId,
    createdAt: staffMember.createdAt,
    updatedAt: staffMember.updatedAt,
    workingHours: workingHoursResult.rows,
    exceptions: exceptionsResult.rows,
    statistics: {
      totalBookings: parseInt(totalBookingsResult.rows[0].count),
      upcomingBookings: parseInt(upcomingBookingsResult.rows[0].count),
      completedBookings: parseInt(completedBookingsResult.rows[0].count),
      averageRating: averageRatingResult.rows[0].averageRating
        ? parseFloat(averageRatingResult.rows[0].averageRating).toFixed(1)
        : null,
    },
  };
};

/**
 * Update staff member details
 */
const updateStaffMember = async (organizerId, staffMemberId, data) => {
  // Verify staff member belongs to organiser
  const existingResult = await pool.query(
    'SELECT * FROM "StaffMember" WHERE "id" = $1 AND "organizerId" = $2',
    [staffMemberId, organizerId]
  );

  if (existingResult.rows.length === 0) {
    throw new AppError('Staff member not found', StatusCodes.NOT_FOUND);
  }

  // If email is being updated, check for conflicts
  if (data.email) {
    const conflictResult = await pool.query(
      'SELECT * FROM "StaffMember" WHERE "organizerId" = $1 AND "email" = $2 AND "id" != $3',
      [organizerId, data.email, staffMemberId]
    );

    if (conflictResult.rows.length > 0) {
      throw new AppError(
        'Another staff member with this email already exists in your organization',
        StatusCodes.CONFLICT
      );
    }
  }

  // Build update query dynamically
  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;

  Object.entries(data).forEach(([key, value]) => {
    updateFields.push(`"${key}" = $${paramIndex}`);
    updateValues.push(value);
    paramIndex++;
  });

  updateFields.push(`"updatedAt" = NOW()`);

  const updateQuery = `
    UPDATE "StaffMember"
    SET ${updateFields.join(', ')}
    WHERE "id" = $${paramIndex} AND "organizerId" = $${paramIndex + 1}
    RETURNING *
  `;

  const result = await pool.query(updateQuery, [...updateValues, staffMemberId, organizerId]);

  const staffMember = result.rows[0];

  return {
    id: staffMember.id,
    name: staffMember.name,
    email: staffMember.email,
    phone: staffMember.phone,
    title: staffMember.title,
    specialization: staffMember.specialization,
    description: staffMember.description,
    profileImage: staffMember.profileImage,
    isActive: staffMember.isActive,
    organizerId: staffMember.organizerId,
    updatedAt: staffMember.updatedAt,
  };
};

/**
 * Soft delete staff member
 */
const deleteStaffMember = async (organizerId, staffMemberId) => {
  // Verify staff member belongs to organiser
  const existingResult = await pool.query(
    'SELECT * FROM "StaffMember" WHERE "id" = $1 AND "organizerId" = $2',
    [staffMemberId, organizerId]
  );

  if (existingResult.rows.length === 0) {
    throw new AppError('Staff member not found', StatusCodes.NOT_FOUND);
  }

  // Check for upcoming bookings
  const upcomingBookingsResult = await pool.query(
    'SELECT COUNT(*) FROM "Booking" WHERE "staffMemberId" = $1 AND "startTime" >= NOW() AND "status" IN ($2, $3)',
    [staffMemberId, 'PENDING', 'CONFIRMED']
  );

  const upcomingCount = parseInt(upcomingBookingsResult.rows[0].count);

  if (upcomingCount > 0) {
    // Cancel upcoming bookings
    await pool.query(
      `UPDATE "Booking"
       SET "status" = $1, 
           "cancellationReason" = $2,
           "cancelledAt" = NOW(),
           "updatedAt" = NOW()
       WHERE "staffMemberId" = $3 AND "startTime" >= NOW() AND "status" IN ($4, $5)`,
      ['CANCELLED', 'Staff member deactivated', staffMemberId, 'PENDING', 'CONFIRMED']
    );
  }

  // Soft delete staff member
  await pool.query(
    'UPDATE "StaffMember" SET "isActive" = FALSE, "updatedAt" = NOW() WHERE "id" = $1',
    [staffMemberId]
  );

  return {
    message: 'Staff member deactivated successfully',
    upcomingBookingsCancelled: upcomingCount,
  };
};

/**
 * Update staff member working hours
 */
const updateWorkingHours = async (organizerId, staffMemberId, workingHours) => {
  // Verify staff member belongs to organiser
  const existingResult = await pool.query(
    'SELECT * FROM "StaffMember" WHERE "id" = $1 AND "organizerId" = $2',
    [staffMemberId, organizerId]
  );

  if (existingResult.rows.length === 0) {
    throw new AppError('Staff member not found', StatusCodes.NOT_FOUND);
  }

  // Delete existing working hours
  await pool.query('DELETE FROM "WorkingHours" WHERE "staffMemberId" = $1', [staffMemberId]);

  // Insert new working hours
  for (const wh of workingHours) {
    await pool.query(
      `INSERT INTO "WorkingHours" 
        ("staffMemberId", "dayOfWeek", "isWorking", "startTime", "endTime", "breakStart", "breakEnd", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        staffMemberId,
        wh.dayOfWeek,
        wh.isWorking,
        wh.isWorking ? wh.startTime : null,
        wh.isWorking ? wh.endTime : null,
        wh.breakStart || null,
        wh.breakEnd || null,
      ]
    );
  }

  // Get updated working hours
  const updatedResult = await pool.query(
    'SELECT "id", "dayOfWeek", "isWorking", "startTime", "endTime", "breakStart", "breakEnd" FROM "WorkingHours" WHERE "staffMemberId" = $1 ORDER BY "dayOfWeek"',
    [staffMemberId]
  );

  return {
    message: 'Working hours updated successfully',
    workingHours: updatedResult.rows,
  };
};

/**
 * Add availability exception for staff member
 */
const addAvailabilityException = async (organizerId, staffMemberId, exceptionData) => {
  const { date, isAvailable, startTime, endTime, reason } = exceptionData;

  // Verify staff member belongs to organiser
  const existingResult = await pool.query(
    'SELECT * FROM "StaffMember" WHERE "id" = $1 AND "organizerId" = $2',
    [staffMemberId, organizerId]
  );

  if (existingResult.rows.length === 0) {
    throw new AppError('Staff member not found', StatusCodes.NOT_FOUND);
  }

  // Check if exception already exists for this date
  const existingExceptionResult = await pool.query(
    'SELECT * FROM "AvailabilityException" WHERE "staffMemberId" = $1 AND "date" = $2',
    [staffMemberId, date]
  );

  let exceptionId;

  if (existingExceptionResult.rows.length > 0) {
    // Update existing exception
    const updateResult = await pool.query(
      `UPDATE "AvailabilityException"
       SET "isAvailable" = $1, "startTime" = $2, "endTime" = $3, "reason" = $4, "updatedAt" = NOW()
       WHERE "staffMemberId" = $5 AND "date" = $6
       RETURNING "id"`,
      [isAvailable, startTime || null, endTime || null, reason || null, staffMemberId, date]
    );
    exceptionId = updateResult.rows[0].id;
  } else {
    // Create new exception
    const insertResult = await pool.query(
      `INSERT INTO "AvailabilityException"
        ("staffMemberId", "date", "isAvailable", "startTime", "endTime", "reason", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING "id"`,
      [staffMemberId, date, isAvailable, startTime || null, endTime || null, reason || null]
    );
    exceptionId = insertResult.rows[0].id;
  }

  // Check for existing bookings on this date
  const affectedBookingsResult = await pool.query(
    `SELECT COUNT(*) FROM "Booking"
     WHERE "staffMemberId" = $1 
     AND DATE("startTime") = $2 
     AND "status" IN ($3, $4)`,
    [staffMemberId, date, 'PENDING', 'CONFIRMED']
  );

  const affectedBookingsCount = parseInt(affectedBookingsResult.rows[0].count);

  return {
    message: 'Availability exception added successfully',
    exceptionId,
    affectedBookings: affectedBookingsCount,
    note: affectedBookingsCount > 0 ? 'There are existing bookings on this date. Please contact affected customers.' : null,
  };
};

module.exports = {
  createStaffMember,
  listStaffMembers,
  getStaffMemberById,
  updateStaffMember,
  deleteStaffMember,
  updateWorkingHours,
  addAvailabilityException,
};
