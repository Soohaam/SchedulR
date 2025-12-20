const { StatusCodes } = require('http-status-codes');
const { pool } = require('../config/db');
const AppError = require('../utils/appError');
const { sendEmail } = require('../utils/email');

/**
 * Verify that the organizer owns the booking
 */
const verifyBookingOwnership = async (bookingId, organizerId) => {
    const result = await pool.query(
        `SELECT b.*, at."organizerId"
     FROM "Booking" b
     JOIN "AppointmentType" at ON b."appointmentTypeId" = at."id"
     WHERE b."id" = $1`,
        [bookingId]
    );

    const booking = result.rows[0];

    if (!booking) {
        throw new AppError('Booking not found', StatusCodes.NOT_FOUND);
    }

    if (booking.organizerId !== organizerId) {
        throw new AppError(
            'You do not have permission to access this booking',
            StatusCodes.FORBIDDEN
        );
    }

    return booking;
};

/**
 * Get all bookings for organizer
 */
const getOrganizerBookings = async (organizerId, filters = {}) => {
    const {
        status,
        appointmentTypeId,
        staffMemberId,
        resourceId,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 20,
    } = filters;

    let whereConditions = ['at."organizerId" = $1'];
    let queryParams = [organizerId];
    let paramIndex = 2;

    // Build WHERE conditions
    if (status) {
        whereConditions.push(`b."status" = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
    }

    if (appointmentTypeId) {
        whereConditions.push(`b."appointmentTypeId" = $${paramIndex}`);
        queryParams.push(appointmentTypeId);
        paramIndex++;
    }

    if (staffMemberId) {
        whereConditions.push(`b."staffMemberId" = $${paramIndex}`);
        queryParams.push(staffMemberId);
        paramIndex++;
    }

    if (resourceId) {
        whereConditions.push(`b."resourceId" = $${paramIndex}`);
        queryParams.push(resourceId);
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

    if (search) {
        whereConditions.push(
            `(c."fullName" ILIKE $${paramIndex} OR c."email" ILIKE $${paramIndex})`
        );
        queryParams.push(`%${search}%`);
        paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
    SELECT COUNT(*) 
    FROM "Booking" b
    JOIN "AppointmentType" at ON b."appointmentTypeId" = at."id"
    JOIN "User" c ON b."customerId" = c."id"
    WHERE ${whereClause}
  `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalBookings = parseInt(countResult.rows[0].count);

    // Get summary statistics
    const summaryQuery = `
    SELECT 
      COUNT(*) FILTER (WHERE b."status" = 'PENDING') as "pendingConfirmation",
      COUNT(*) FILTER (WHERE b."status" = 'CONFIRMED') as "confirmed",
      COUNT(*) FILTER (WHERE b."status" = 'COMPLETED') as "completed",
      COUNT(*) FILTER (WHERE b."status" = 'CANCELLED') as "cancelled"
    FROM "Booking" b
    JOIN "AppointmentType" at ON b."appointmentTypeId" = at."id"
    WHERE at."organizerId" = $1
  `;
    const summaryResult = await pool.query(summaryQuery, [organizerId]);
    const summary = summaryResult.rows[0];

    // Calculate pagination
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(totalBookings / limit);

    // Get paginated bookings
    const bookingsQuery = `
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
      b."answers",
      b."createdAt",
      b."confirmationMessage",
      c."fullName" as "customerName",
      c."email" as "customerEmailFromUser",
      c."phone" as "customerPhoneFromUser",
      at."id" as "appointmentTypeId",
      at."title" as "appointmentTitle",
      at."duration" as "appointmentDuration",
      sm."name" as "staffMemberName",
      r."name" as "resourceName",
      CASE 
        WHEN sm."id" IS NOT NULL THEN 'STAFF'
        WHEN r."id" IS NOT NULL THEN 'RESOURCE'
        ELSE NULL
      END as "providerType",
      p."amount" as "paymentAmount",
      p."status" as "paymentStatus"
    FROM "Booking" b
    JOIN "AppointmentType" at ON b."appointmentTypeId" = at."id"
    JOIN "User" c ON b."customerId" = c."id"
    LEFT JOIN "StaffMember" sm ON b."staffMemberId" = sm."id"
    LEFT JOIN "Resource" r ON b."resourceId" = r."id"
    LEFT JOIN "Payment" p ON b."id" = p."bookingId"
    WHERE ${whereClause}
    ORDER BY b."startTime" DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

    queryParams.push(limit, offset);
    const bookingsResult = await pool.query(bookingsQuery, queryParams);

    // Format bookings
    const bookings = bookingsResult.rows.map((booking) => {
        // Parse answers if it's a string
        let parsedAnswers = null;
        if (booking.answers) {
            try {
                parsedAnswers = typeof booking.answers === 'string' 
                    ? JSON.parse(booking.answers) 
                    : booking.answers;
            } catch (e) {
                console.error('Failed to parse answers:', e);
                parsedAnswers = null;
            }
        }

        return {
            id: booking.id,
            customer: {
                fullName: booking.customerName,
                name: booking.customerName,
                email: booking.customerEmailFromUser || booking.customerEmail,
                phone: booking.customerPhoneFromUser || booking.customerPhone,
            },
            customerEmail: booking.customerEmailFromUser || booking.customerEmail,
            appointmentType: {
                id: booking.appointmentTypeId,
                title: booking.appointmentTitle,
                duration: booking.appointmentDuration || 30,
            },
            staffMember: booking.staffMemberName && booking.providerType === 'STAFF'
                ? {
                    name: booking.staffMemberName,
                }
                : null,
            resource: booking.resourceName && booking.providerType === 'RESOURCE'
                ? {
                    name: booking.resourceName,
                }
                : null,
            provider: booking.staffMemberName || booking.resourceName
                ? {
                    name: booking.staffMemberName || booking.resourceName,
                    type: booking.providerType,
                }
                : null,
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            answers: parsedAnswers,
            payment: booking.paymentAmount
                ? {
                    status: booking.paymentStatus,
                    amount: parseFloat(booking.paymentAmount),
                }
                : null,
            createdAt: booking.createdAt,
        };
    });

    return {
        bookings,
        pagination: {
            total: totalBookings,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
        summary: {
            totalBookings: parseInt(summary.pendingConfirmation) + parseInt(summary.confirmed) + parseInt(summary.completed) + parseInt(summary.cancelled),
            pendingConfirmation: parseInt(summary.pendingConfirmation) || 0,
            confirmed: parseInt(summary.confirmed) || 0,
            completed: parseInt(summary.completed) || 0,
            cancelled: parseInt(summary.cancelled) || 0,
        },
    };
};

/**
 * Get booking by ID
 */
const getBookingById = async (bookingId, organizerId) => {
    await verifyBookingOwnership(bookingId, organizerId);

    const bookingQuery = `
    SELECT 
      b.*,
      c."fullName" as "customerName",
      c."email" as "customerEmail",
      c."phone" as "customerPhone",
      at."title" as "appointmentTitle",
      at."description" as "appointmentDescription",
      at."duration" as "appointmentDuration",
      sm."name" as "staffMemberName",
      sm."email" as "staffMemberEmail",
      r."name" as "resourceName",
      p."amount" as "paymentAmount",
      p."status" as "paymentStatus",
      p."provider" as "paymentProvider",
      p."paymentMethod" as "paymentMethod",
      p."providerTransactionId" as "paymentTransactionId"
    FROM "Booking" b
    JOIN "AppointmentType" at ON b."appointmentTypeId" = at."id"
    JOIN "User" c ON b."customerId" = c."id"
    LEFT JOIN "StaffMember" sm ON b."staffMemberId" = sm."id"
    LEFT JOIN "Resource" r ON b."resourceId" = r."id"
    LEFT JOIN "Payment" p ON b."id" = p."bookingId"
    WHERE b."id" = $1
  `;

    const bookingResult = await pool.query(bookingQuery, [bookingId]);
    const booking = bookingResult.rows[0];

    // Get booking history
    const historyQuery = `
    SELECT 
      bh."action",
      bh."oldStatus",
      bh."newStatus",
      bh."oldStartTime",
      bh."newStartTime",
      bh."reason",
      bh."createdAt",
      u."fullName" as "performedByName"
    FROM "BookingHistory" bh
    JOIN "User" u ON bh."performedBy" = u."id"
    WHERE bh."bookingId" = $1
    ORDER BY bh."createdAt" DESC
  `;

    const historyResult = await pool.query(historyQuery, [bookingId]);

    return {
        booking: {
            id: booking.id,
            customer: {
                name: booking.customerName,
                email: booking.customerEmail,
                phone: booking.customerPhone,
            },
            appointmentType: {
                title: booking.appointmentTitle,
                description: booking.appointmentDescription,
                duration: booking.appointmentDuration,
            },
            provider: booking.staffMemberName || booking.resourceName
                ? {
                    name: booking.staffMemberName || booking.resourceName,
                    email: booking.staffMemberEmail,
                    type: booking.staffMemberName ? 'STAFF' : 'RESOURCE',
                }
                : null,
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            venue: booking.venue,
            notes: booking.notes,
            answers: booking.answers,
            confirmationMessage: booking.confirmationMessage,
            cancellationReason: booking.cancellationReason,
            cancelledBy: booking.cancelledBy,
            cancelledAt: booking.cancelledAt,
            payment: booking.paymentAmount
                ? {
                    amount: parseFloat(booking.paymentAmount),
                    status: booking.paymentStatus,
                    provider: booking.paymentProvider,
                    method: booking.paymentMethod,
                    transactionId: booking.paymentTransactionId,
                }
                : null,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
        },
        history: historyResult.rows,
    };
};

/**
 * Get booking calendar
 */
const getBookingCalendar = async (organizerId, month, filters = {}) => {
    const { staffMemberId, resourceId } = filters;

    // Parse month (format: YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    let whereConditions = [
        'at."organizerId" = $1',
        'b."startTime" >= $2',
        'b."startTime" <= $3',
    ];
    let queryParams = [organizerId, startDate.toISOString(), endDate.toISOString()];
    let paramIndex = 4;

    if (staffMemberId) {
        whereConditions.push(`b."staffMemberId" = $${paramIndex}`);
        queryParams.push(staffMemberId);
        paramIndex++;
    }

    if (resourceId) {
        whereConditions.push(`b."resourceId" = $${paramIndex}`);
        queryParams.push(resourceId);
        paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const bookingsQuery = `
    SELECT 
      b."id",
      b."startTime",
      b."status",
      c."fullName" as "customerName",
      at."title" as "appointmentTitle"
    FROM "Booking" b
    JOIN "AppointmentType" at ON b."appointmentTypeId" = at."id"
    JOIN "User" c ON b."customerId" = c."id"
    WHERE ${whereClause}
    ORDER BY b."startTime" ASC
  `;

    const bookingsResult = await pool.query(bookingsQuery, queryParams);

    // Group bookings by date
    const calendar = {};
    const dateCounts = {};

    bookingsResult.rows.forEach((booking) => {
        const date = new Date(booking.startTime).toISOString().split('T')[0];
        const time = new Date(booking.startTime).toTimeString().slice(0, 5);

        if (!calendar[date]) {
            calendar[date] = [];
            dateCounts[date] = 0;
        }

        calendar[date].push({
            id: booking.id,
            time,
            customer: booking.customerName,
            appointmentType: booking.appointmentTitle,
            status: booking.status,
        });

        dateCounts[date]++;
    });

    // Calculate statistics
    const totalBookings = bookingsResult.rows.length;
    const busyDays = Object.keys(calendar).length;

    let peakDay = null;
    let peakDayBookings = 0;

    Object.entries(dateCounts).forEach(([date, count]) => {
        if (count > peakDayBookings) {
            peakDay = date;
            peakDayBookings = count;
        }
    });

    return {
        month,
        calendar,
        statistics: {
            totalBookings,
            busyDays,
            peakDay,
            peakDayBookings,
        },
    };
};

/**
 * Confirm booking
 */
const confirmBooking = async (bookingId, organizerId, confirmationMessage = '') => {
    const booking = await verifyBookingOwnership(bookingId, organizerId);

    if (booking.status !== 'PENDING') {
        throw new AppError(
            'Only pending bookings can be confirmed',
            StatusCodes.BAD_REQUEST
        );
    }

    // Update booking
    const updateResult = await pool.query(
        `UPDATE "Booking"
     SET "status" = 'CONFIRMED', 
         "confirmationMessage" = $1,
         "updatedAt" = NOW()
     WHERE "id" = $2
     RETURNING *`,
        [confirmationMessage, bookingId]
    );

    const updatedBooking = updateResult.rows[0];

    // Create booking history
    await pool.query(
        `INSERT INTO "BookingHistory" 
     ("bookingId", "action", "oldStatus", "newStatus", "performedBy", "createdAt")
     VALUES ($1, 'CONFIRMED', 'PENDING', 'CONFIRMED', $2, NOW())`,
        [bookingId, organizerId]
    );

    // Get customer details
    const customerResult = await pool.query(
        `SELECT u."email", u."fullName", at."title"
     FROM "Booking" b
     JOIN "User" u ON b."customerId" = u."id"
     JOIN "AppointmentType" at ON b."appointmentTypeId" = at."id"
     WHERE b."id" = $1`,
        [bookingId]
    );

    const customer = customerResult.rows[0];

    // Send confirmation email
    await sendEmail({
        to: customer.email,
        subject: `Booking Confirmed - ${customer.title}`,
        text: `Your booking has been confirmed. ${confirmationMessage}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Booking Confirmed!</h2>
        <p>Hi <strong>${customer.fullName}</strong>,</p>
        <p>Great news! Your booking for <strong>${customer.title}</strong> has been confirmed.</p>
        ${confirmationMessage ? `<p><em>${confirmationMessage}</em></p>` : ''}
        <p><strong>Date:</strong> ${new Date(updatedBooking.startTime).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${new Date(updatedBooking.startTime).toLocaleTimeString()}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Best regards,<br>Odoo Appointment Booking Team</p>
      </div>
    `,
    });

    return {
        message: 'Booking confirmed successfully',
        booking: {
            id: updatedBooking.id,
            status: updatedBooking.status,
            confirmationMessage: updatedBooking.confirmationMessage,
        },
    };
};

/**
 * Reject booking
 */
const rejectBooking = async (bookingId, organizerId, reason) => {
    const booking = await verifyBookingOwnership(bookingId, organizerId);

    if (booking.status !== 'PENDING') {
        throw new AppError(
            'Only pending bookings can be rejected',
            StatusCodes.BAD_REQUEST
        );
    }

    // Update booking
    await pool.query(
        `UPDATE "Booking"
     SET "status" = 'CANCELLED', 
         "cancellationReason" = $1,
         "cancelledBy" = $2,
         "cancelledAt" = NOW(),
         "updatedAt" = NOW()
     WHERE "id" = $3`,
        [reason, organizerId, bookingId]
    );

    // Process refund if payment exists
    const paymentResult = await pool.query(
        `SELECT * FROM "Payment" WHERE "bookingId" = $1 AND "status" = 'SUCCESS'`,
        [bookingId]
    );

    if (paymentResult.rows.length > 0) {
        const payment = paymentResult.rows[0];
        await pool.query(
            `UPDATE "Payment"
       SET "status" = 'REFUNDED',
           "refundAmount" = "amount",
           "refundReason" = $1,
           "refundedAt" = NOW(),
           "updatedAt" = NOW()
       WHERE "id" = $2`,
            [reason, payment.id]
        );
    }

    // Create booking history
    await pool.query(
        `INSERT INTO "BookingHistory" 
     ("bookingId", "action", "oldStatus", "newStatus", "reason", "performedBy", "createdAt")
     VALUES ($1, 'CANCELLED', 'PENDING', 'CANCELLED', $2, $3, NOW())`,
        [bookingId, reason, organizerId]
    );

    // Get customer details
    const customerResult = await pool.query(
        `SELECT u."email", u."fullName", at."title"
     FROM "Booking" b
     JOIN "User" u ON b."customerId" = u."id"
     JOIN "AppointmentType" at ON b."appointmentTypeId" = at."id"
     WHERE b."id" = $1`,
        [bookingId]
    );

    const customer = customerResult.rows[0];

    // Send rejection email
    await sendEmail({
        to: customer.email,
        subject: `Booking Rejected - ${customer.title}`,
        text: `Your booking has been rejected. Reason: ${reason}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Booking Rejected</h2>
        <p>Hi <strong>${customer.fullName}</strong>,</p>
        <p>Unfortunately, your booking for <strong>${customer.title}</strong> has been rejected.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        ${paymentResult.rows.length > 0 ? '<p>A full refund has been processed and will be credited to your account within 5-7 business days.</p>' : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Best regards,<br>Odoo Appointment Booking Team</p>
      </div>
    `,
    });

    return {
        message: 'Booking rejected successfully',
        refundProcessed: paymentResult.rows.length > 0,
    };
};

/**
 * Complete booking
 */
const completeBooking = async (bookingId, organizerId) => {
    const booking = await verifyBookingOwnership(bookingId, organizerId);

    if (booking.status !== 'CONFIRMED') {
        throw new AppError(
            'Only confirmed bookings can be marked as completed',
            StatusCodes.BAD_REQUEST
        );
    }

    // Check if booking time has passed
    const now = new Date();
    const bookingEndTime = new Date(booking.endTime);

    if (bookingEndTime > now) {
        throw new AppError(
            'Cannot mark booking as completed before the appointment time',
            StatusCodes.BAD_REQUEST
        );
    }

    // Update booking
    await pool.query(
        `UPDATE "Booking"
     SET "status" = 'COMPLETED', 
         "updatedAt" = NOW()
     WHERE "id" = $1`,
        [bookingId]
    );

    // Create booking history
    await pool.query(
        `INSERT INTO "BookingHistory" 
     ("bookingId", "action", "oldStatus", "newStatus", "performedBy", "createdAt")
     VALUES ($1, 'COMPLETED', 'CONFIRMED', 'COMPLETED', $2, NOW())`,
        [bookingId, organizerId]
    );

    // Get customer details
    const customerResult = await pool.query(
        `SELECT u."email", u."fullName", at."title"
     FROM "Booking" b
     JOIN "User" u ON b."customerId" = u."id"
     JOIN "AppointmentType" at ON b."appointmentTypeId" = at."id"
     WHERE b."id" = $1`,
        [bookingId]
    );

    const customer = customerResult.rows[0];

    // Send review request email
    await sendEmail({
        to: customer.email,
        subject: `How was your appointment? - ${customer.title}`,
        text: `Thank you for your appointment. We'd love to hear your feedback!`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank You!</h2>
        <p>Hi <strong>${customer.fullName}</strong>,</p>
        <p>Thank you for your appointment for <strong>${customer.title}</strong>.</p>
        <p>We'd love to hear about your experience. Please take a moment to leave us a review!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Best regards,<br>Odoo Appointment Booking Team</p>
      </div>
    `,
    });

    return {
        message: 'Booking marked as completed successfully',
    };
};

/**
 * Cancel booking
 */
const cancelBooking = async (bookingId, organizerId, reason) => {
    const booking = await verifyBookingOwnership(bookingId, organizerId);

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
        throw new AppError(
            'Cannot cancel a booking that is already cancelled or completed',
            StatusCodes.BAD_REQUEST
        );
    }

    const oldStatus = booking.status;

    // Update booking
    await pool.query(
        `UPDATE "Booking"
     SET "status" = 'CANCELLED', 
         "cancellationReason" = $1,
         "cancelledBy" = $2,
         "cancelledAt" = NOW(),
         "updatedAt" = NOW()
     WHERE "id" = $3`,
        [reason, organizerId, bookingId]
    );

    // Process full refund if payment exists
    const paymentResult = await pool.query(
        `SELECT * FROM "Payment" WHERE "bookingId" = $1 AND "status" = 'SUCCESS'`,
        [bookingId]
    );

    if (paymentResult.rows.length > 0) {
        const payment = paymentResult.rows[0];
        await pool.query(
            `UPDATE "Payment"
       SET "status" = 'REFUNDED',
           "refundAmount" = "amount",
           "refundReason" = $1,
           "refundedAt" = NOW(),
           "updatedAt" = NOW()
       WHERE "id" = $2`,
            [reason, payment.id]
        );
    }

    // Create booking history
    await pool.query(
        `INSERT INTO "BookingHistory" 
     ("bookingId", "action", "oldStatus", "newStatus", "reason", "performedBy", "createdAt")
     VALUES ($1, 'CANCELLED', $2, 'CANCELLED', $3, $4, NOW())`,
        [bookingId, oldStatus, reason, organizerId]
    );

    // Get customer details
    const customerResult = await pool.query(
        `SELECT u."email", u."fullName", at."title"
     FROM "Booking" b
     JOIN "User" u ON b."customerId" = u."id"
     JOIN "AppointmentType" at ON b."appointmentTypeId" = at."id"
     WHERE b."id" = $1`,
        [bookingId]
    );

    const customer = customerResult.rows[0];

    // Send cancellation email
    await sendEmail({
        to: customer.email,
        subject: `Booking Cancelled - ${customer.title}`,
        text: `Your booking has been cancelled. Reason: ${reason}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Booking Cancelled</h2>
        <p>Hi <strong>${customer.fullName}</strong>,</p>
        <p>Your booking for <strong>${customer.title}</strong> has been cancelled by the organizer.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        ${paymentResult.rows.length > 0 ? '<p>A full refund has been processed and will be credited to your account within 5-7 business days.</p>' : ''}
        <p>We apologize for any inconvenience.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Best regards,<br>Odoo Appointment Booking Team</p>
      </div>
    `,
    });

    return {
        message: 'Booking cancelled successfully',
        refundProcessed: paymentResult.rows.length > 0,
    };
};

/**
 * Reschedule booking
 */
const rescheduleBooking = async (bookingId, organizerId, newStartTime, reason = '') => {
    const booking = await verifyBookingOwnership(bookingId, organizerId);

    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
        throw new AppError(
            'Only confirmed or pending bookings can be rescheduled',
            StatusCodes.BAD_REQUEST
        );
    }

    const oldStartTime = booking.startTime;
    const oldEndTime = booking.endTime;

    // Get appointment duration
    const appointmentResult = await pool.query(
        `SELECT "duration" FROM "AppointmentType" WHERE "id" = $1`,
        [booking.appointmentTypeId]
    );
    const duration = appointmentResult.rows[0].duration;

    // Calculate new end time
    const newStartDate = new Date(newStartTime);
    const newEndDate = new Date(newStartDate.getTime() + duration * 60000);

    // Update booking
    await pool.query(
        `UPDATE "Booking"
     SET "startTime" = $1, 
         "endTime" = $2,
         "date" = $3,
         "updatedAt" = NOW()
     WHERE "id" = $4`,
        [newStartTime, newEndDate.toISOString(), newStartDate.toISOString().split('T')[0], bookingId]
    );

    // Create booking history
    await pool.query(
        `INSERT INTO "BookingHistory" 
     ("bookingId", "action", "oldStartTime", "newStartTime", "reason", "performedBy", "createdAt")
     VALUES ($1, 'RESCHEDULED', $2, $3, $4, $5, NOW())`,
        [bookingId, oldStartTime, newStartTime, reason, organizerId]
    );

    // Get customer details
    const customerResult = await pool.query(
        `SELECT u."email", u."fullName", at."title"
     FROM "Booking" b
     JOIN "User" u ON b."customerId" = u."id"
     JOIN "AppointmentType" at ON b."appointmentTypeId" = at."id"
     WHERE b."id" = $1`,
        [bookingId]
    );

    const customer = customerResult.rows[0];

    // Send reschedule email
    await sendEmail({
        to: customer.email,
        subject: `Booking Rescheduled - ${customer.title}`,
        text: `Your booking has been rescheduled.`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ffc107;">Booking Rescheduled</h2>
        <p>Hi <strong>${customer.fullName}</strong>,</p>
        <p>Your booking for <strong>${customer.title}</strong> has been rescheduled.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p><strong>Old Date & Time:</strong> ${new Date(oldStartTime).toLocaleString()}</p>
        <p><strong>New Date & Time:</strong> ${new Date(newStartTime).toLocaleString()}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Best regards,<br>Odoo Appointment Booking Team</p>
      </div>
    `,
    });

    return {
        message: 'Booking rescheduled successfully',
        newStartTime,
        newEndTime: newEndDate.toISOString(),
    };
};

module.exports = {
    getOrganizerBookings,
    getBookingById,
    getBookingCalendar,
    confirmBooking,
    rejectBooking,
    completeBooking,
    cancelBooking,
    rescheduleBooking,
};
