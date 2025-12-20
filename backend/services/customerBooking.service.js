const { pool } = require('../config/db');
const AppError = require('../utils/appError');
const { StatusCodes } = require('http-status-codes');
const { sendEmail } = require('../utils/email');
const { getEmailTemplate } = require('../utils/emailTemplates');
const crypto = require('crypto');

/**
 * Helper: Get provider name by ID and type
 */
const getProviderName = async (client, providerId, providerType) => {
    if (providerType === 'STAFF') {
        const result = await client.query(
            'SELECT name FROM "StaffMember" WHERE id = $1',
            [providerId]
        );
        return result.rows[0]?.name;
    } else {
        const result = await client.query(
            'SELECT name FROM "Resource" WHERE id = $1',
            [providerId]
        );
        return result.rows[0]?.name;
    }
};

/**
 * Helper: Calculate cancellation eligibility
 */
const calculateCancellationEligibility = (booking, startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const hoursUntilBooking = (start - now) / (1000 * 60 * 60);

    let canCancel = false;
    let cancellationDeadline = null;

    if (booking.allowCancellation && (booking.status === 'PENDING' || booking.status === 'CONFIRMED')) {
        const deadlineHours = booking.cancellationDeadlineHours || 24;
        if (hoursUntilBooking > deadlineHours) {
            canCancel = true;
        }
        cancellationDeadline = new Date(start.getTime() - (deadlineHours * 60 * 60 * 1000));
    }

    return { canCancel, cancellationDeadline };
};

/**
 * Helper: Send booking email using templates
 */
const sendBookingEmail = async (type, data) => {
    const { subject, text, html } = getEmailTemplate(type, data);

    await sendEmail({
        to: data.customerEmail,
        subject,
        text,
        html
    });
};

/**
 * Validate question answers against appointment type questions
 */
const validateAnswers = async (client, appointmentTypeId, answers) => {
    const questionsQuery = `
        SELECT id, "questionText", "questionType", "isRequired"
        FROM "Question"
        WHERE "appointmentTypeId" = $1
    `;
    const questionsResult = await client.query(questionsQuery, [appointmentTypeId]);
    const questions = questionsResult.rows;

    for (const question of questions) {
        if (question.isRequired) {
            const answer = answers?.find(a => a.questionId === question.id);
            if (!answer || !answer.answer || answer.answer.trim() === '') {
                throw new AppError(
                    `Required question "${question.questionText}" must be answered`,
                    StatusCodes.BAD_REQUEST
                );
            }
        }
    }

    return true;
};

/**
 * Validate booking window rules
 */
const validateBookingWindow = (appointmentType, startTime) => {
    const now = new Date();
    const bookingTime = new Date(startTime);
    const minutesUntilBooking = (bookingTime - now) / (1000 * 60);

    if (appointmentType.minAdvanceBookingMinutes && minutesUntilBooking < appointmentType.minAdvanceBookingMinutes) {
        throw new AppError(
            `Bookings must be made at least ${appointmentType.minAdvanceBookingMinutes} minutes in advance`,
            StatusCodes.BAD_REQUEST
        );
    }

    if (appointmentType.maxAdvanceBookingDays) {
        const maxMinutes = appointmentType.maxAdvanceBookingDays * 24 * 60;
        if (minutesUntilBooking > maxMinutes) {
            throw new AppError(
                `Bookings cannot be made more than ${appointmentType.maxAdvanceBookingDays} days in advance`,
                StatusCodes.BAD_REQUEST
            );
        }
    }

    return true;
};

/**
 * Create a new booking
 */
const createBooking = async ({
    appointmentTypeId,
    providerId,
    providerType,
    date,
    startTime,
    capacity = 1,
    answers,
    notes,
    customerId
}) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Verify customer is logged in
        if (!customerId) {
            throw new AppError(
                'Authentication required. Please login or register to create a booking.',
                StatusCodes.UNAUTHORIZED
            );
        }

        // Get customer details
        const userResult = await client.query(
            'SELECT id, email, "fullName", role, "isActive" FROM "User" WHERE id = $1',
            [customerId]
        );

        if (userResult.rows.length === 0) {
            throw new AppError('Customer not found', StatusCodes.NOT_FOUND);
        }

        const user = userResult.rows[0];

        if (!user.isActive) {
            throw new AppError('Your account is inactive. Please contact support.', StatusCodes.FORBIDDEN);
        }

        if (user.role !== 'CUSTOMER') {
            throw new AppError('Only customers can create bookings', StatusCodes.FORBIDDEN);
        }

        const customerEmail = user.email;
        const customerName = user.fullName;

        // 2. Get appointment type details
        const aptResult = await client.query('SELECT * FROM "AppointmentType" WHERE id = $1', [appointmentTypeId]);
        if (aptResult.rows.length === 0) {
            throw new AppError('Appointment Type not found', StatusCodes.NOT_FOUND);
        }
        const appointmentType = aptResult.rows[0];

        // 3. Validate booking window and answers
        validateBookingWindow(appointmentType, startTime);
        if (answers && answers.length > 0) {
            await validateAnswers(client, appointmentTypeId, answers);
        }

        // 4. Calculate times
        const start = new Date(startTime);
        const end = new Date(start.getTime() + appointmentType.duration * 60000);
        const dayOfWeek = start.getDay();
        const timeStr = start.toTimeString().slice(0, 5);
        const endTimeStr = end.toTimeString().slice(0, 5);

        // 5. Validate slot availability
        const idCol = providerType === 'RESOURCE' ? '"resourceId"' : '"staffMemberId"';

        // Check working hours for the appointment type
        const whResult = await client.query(
            `SELECT * FROM "WorkingHours"
             WHERE "appointmentTypeId" = $1 AND "dayOfWeek" = $2 AND "isWorking" = TRUE
             AND "startTime" <= $3 AND "endTime" >= $4`,
            [appointmentTypeId, dayOfWeek, timeStr, endTimeStr]
        );

        if (whResult.rows.length === 0) {
            throw new AppError('Provider is not available at the selected time', StatusCodes.BAD_REQUEST);
        }

        // Check availability exceptions
        const exceptionResult = await client.query(
            `SELECT * FROM "AvailabilityException"
             WHERE ${idCol} = $1 AND date = $2::date AND "isAvailable" = FALSE`,
            [providerId, date]
        );

        if (exceptionResult.rows.length > 0) {
            throw new AppError('Provider is not available on the selected date', StatusCodes.BAD_REQUEST);
        }

        // Check capacity (lock the table to prevent race conditions)
        const bookingCheckResult = await client.query(
            `SELECT COUNT(*) as count FROM "Booking"
             WHERE ${idCol} = $1 AND date = $2::date AND status != 'CANCELLED'
             AND "startTime" < $4 AND "endTime" > $3`,
            [providerId, date, start.toISOString(), end.toISOString()]
        );

        const currentBookings = parseInt(bookingCheckResult.rows[0].count);
        const maxCapacity = appointmentType.maxBookingsPerSlot || 1;

        if (currentBookings + capacity > maxCapacity) {
            throw new AppError('Selected slot is no longer available', StatusCodes.CONFLICT);
        }

        // 6. Determine booking status
        let status = 'CONFIRMED';
        if (appointmentType.requiresPayment || appointmentType.manualConfirmation) {
            status = 'PENDING';
        }

        // 7. Create booking
        const staffId = providerType === 'STAFF' ? providerId : null;
        const resId = providerType === 'RESOURCE' ? providerId : null;

        const bookingResult = await client.query(
            `INSERT INTO "Booking" (
                id, "appointmentTypeId", "customerId", "staffMemberId", "resourceId",
                date, "startTime", "endTime", status, capacity, answers, notes,
                "customerEmail", "confirmationMessage", "createdAt", "updatedAt"
            ) VALUES (
                gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
            ) RETURNING *`,
            [appointmentTypeId, customerId, staffId, resId, date, start, end, status, capacity,
                JSON.stringify(answers || []), notes, customerEmail, appointmentType.confirmationMessage]
        );

        const booking = bookingResult.rows[0];

        // 8. Get provider name
        const providerName = await getProviderName(client, providerId, providerType);

        // 9. Create payment if required
        let payment = null;
        if (appointmentType.requiresPayment && appointmentType.price > 0) {
            const paymentIntentId = `pi_${crypto.randomBytes(12).toString('hex')}`;
            const clientSecret = `secret_${crypto.randomBytes(16).toString('hex')}`;

            const paymentResult = await client.query(
                `INSERT INTO "Payment" (
                    id, amount, currency, provider, status, "providerTransactionId", "bookingId", "createdAt", "updatedAt"
                ) VALUES (
                    gen_random_uuid(), $1, 'USD', 'STRIPE', 'PENDING', $2, $3, NOW(), NOW()
                ) RETURNING *`,
                [appointmentType.price, paymentIntentId, booking.id]
            );

            payment = {
                required: true,
                amount: parseFloat(appointmentType.price),
                currency: 'USD',
                paymentIntentId,
                clientSecret,
                id: paymentResult.rows[0].id
            };
        }

        // 10. Create booking history
        await client.query(
            `INSERT INTO "BookingHistory" (id, "bookingId", action, "performedBy", "newStatus", "createdAt")
             VALUES (gen_random_uuid(), $1, 'CREATED', $2, $3, NOW())`,
            [booking.id, customerId, status]
        );

        // 11. Send email
        await sendBookingEmail('created', {
            customerName,
            customerEmail,
            appointmentTitle: appointmentType.title,
            providerName,
            date,
            startTime: start,
            endTime: end,
            status,
            payment,
            confirmationMessage: appointmentType.confirmationMessage
        });

        await client.query('COMMIT');

        return {
            success: true,
            booking: {
                id: booking.id,
                appointmentType: {
                    title: appointmentType.title,
                    duration: appointmentType.duration
                },
                provider: {
                    name: providerName,
                    type: providerType
                },
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime,
                status: booking.status,
                confirmationMessage: booking.confirmationMessage
            },
            payment
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Confirm payment after successful transaction
 */
const confirmPayment = async (bookingId, paymentIntentId, transactionId, userId) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const bookingResult = await client.query(
            `SELECT b.*, p.id as "paymentId", p.status as "paymentStatus", p."providerTransactionId",
                    at.title as "appointmentTitle", at."manualConfirmation",
                    u."fullName" as "customerName", u.email as "customerEmail"
             FROM "Booking" b
             LEFT JOIN "Payment" p ON b.id = p."bookingId"
             INNER JOIN "AppointmentType" at ON b."appointmentTypeId" = at.id
             INNER JOIN "User" u ON b."customerId" = u.id
             WHERE b.id = $1 FOR UPDATE`,
            [bookingId]
        );

        if (bookingResult.rows.length === 0) {
            throw new AppError('Booking not found', StatusCodes.NOT_FOUND);
        }

        const booking = bookingResult.rows[0];

        if (!userId) {
            throw new AppError('User must be logged in', StatusCodes.UNAUTHORIZED);
        }

        if (booking.customerId !== userId) {
            throw new AppError('You are not authorized to confirm payment for this booking', StatusCodes.FORBIDDEN);
        }

        if (!booking.paymentId) {
            throw new AppError('No payment record found for this booking', StatusCodes.NOT_FOUND);
        }

        if (booking.paymentStatus === 'SUCCESS') {
            throw new AppError('Payment has already been confirmed', StatusCodes.BAD_REQUEST);
        }

        if (!transactionId) {
            throw new AppError('Transaction ID is required', StatusCodes.BAD_REQUEST);
        }

        // Update payment
        await client.query(
            `UPDATE "Payment" SET status = 'SUCCESS', "providerTransactionId" = $1, "updatedAt" = NOW() WHERE id = $2`,
            [transactionId, booking.paymentId]
        );

        // Update booking status
        let newStatus = booking.status;
        if (!booking.manualConfirmation) {
            newStatus = 'CONFIRMED';
            await client.query(
                `UPDATE "Booking" SET status = 'CONFIRMED', "updatedAt" = NOW() WHERE id = $1`,
                [bookingId]
            );
        }

        // Create history
        await client.query(
            `INSERT INTO "BookingHistory" (id, "bookingId", action, "performedBy", "oldStatus", "newStatus", "createdAt")
             VALUES (gen_random_uuid(), $1, 'PAYMENT_RECEIVED', $2, $3, $4, NOW())`,
            [bookingId, userId, booking.status, newStatus]
        );

        // Get provider name
        const providerName = await getProviderName(
            client,
            booking.staffMemberId || booking.resourceId,
            booking.staffMemberId ? 'STAFF' : 'RESOURCE'
        );

        // Send email
        await sendBookingEmail('paymentConfirmed', {
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            appointmentTitle: booking.appointmentTitle,
            providerName,
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: newStatus,
            transactionId
        });

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Payment confirmed successfully',
            booking: {
                id: bookingId,
                status: newStatus
            }
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get booking details (basic - used internally)
 */
const getBookingDetails = async (bookingId, userId) => {
    const query = `
        SELECT b.*, at.title as "appointmentTitle", at.description as "appointmentDescription", at.duration,
               u."fullName" as "customerName", u.email as "customerEmail",
               sm.name as "staffName", r.name as "resourceName",
               p.amount as "paymentAmount", p.status as "paymentStatus", p."providerTransactionId"
        FROM "Booking" b
        INNER JOIN "AppointmentType" at ON b."appointmentTypeId" = at.id
        INNER JOIN "User" u ON b."customerId" = u.id
        LEFT JOIN "StaffMember" sm ON b."staffMemberId" = sm.id
        LEFT JOIN "Resource" r ON b."resourceId" = r.id
        LEFT JOIN "Payment" p ON b.id = p."bookingId"
        WHERE b.id = $1
    `;

    const result = await pool.query(query, [bookingId]);

    if (result.rows.length === 0) {
        throw new AppError('Booking not found', StatusCodes.NOT_FOUND);
    }

    const booking = result.rows[0];

    return {
        success: true,
        booking: {
            id: booking.id,
            appointmentType: {
                title: booking.appointmentTitle,
                description: booking.appointmentDescription,
                duration: booking.duration
            },
            customer: {
                name: booking.customerName,
                email: booking.customerEmail
            },
            provider: {
                name: booking.staffName || booking.resourceName,
                type: booking.staffMemberId ? 'STAFF' : 'RESOURCE'
            },
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            capacity: booking.capacity,
            notes: booking.notes,
            answers: booking.answers,
            confirmationMessage: booking.confirmationMessage,
            payment: booking.paymentAmount ? {
                amount: parseFloat(booking.paymentAmount),
                status: booking.paymentStatus,
                transactionId: booking.providerTransactionId
            } : null,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt
        }
    };
};

/**
 * Get customer's bookings with filters
 */
const getMyBookings = async (customerId, filters = {}) => {
    const { status, upcoming, past, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;
    const conditions = ['b."customerId" = $1'];
    const params = [customerId];
    let paramIndex = 2;

    if (status) {
        conditions.push(`b.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
    }

    if (upcoming === 'true' || upcoming === true) {
        conditions.push(`b."startTime" >= NOW()`);
    }

    if (past === 'true' || past === true) {
        conditions.push(`b."startTime" < NOW()`);
    }

    const whereClause = conditions.join(' AND ');

    const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM "Booking" b WHERE ${whereClause}`,
        params
    );
    const total = parseInt(countResult.rows[0].total);

    const dataResult = await pool.query(
        `SELECT b.id, b.date, b."startTime", b."endTime", b.status, b.venue, b."createdAt",
                at.title as "appointmentTitle", at.duration, at.location,
                sm.name as "staffName", sm."profileImage" as "staffImage", sm.title as "staffTitle",
                r.name as "resourceName", r."imageUrl" as "resourceImage",
                cp."allowCancellation", cp."cancellationDeadlineHours"
         FROM "Booking" b
         INNER JOIN "AppointmentType" at ON b."appointmentTypeId" = at.id
         LEFT JOIN "StaffMember" sm ON b."staffMemberId" = sm.id
         LEFT JOIN "Resource" r ON b."resourceId" = r.id
         LEFT JOIN "CancellationPolicy" cp ON at.id = cp."appointmentTypeId"
         WHERE ${whereClause}
         ORDER BY b."startTime" DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
    );

    const bookings = dataResult.rows.map(booking => {
        const { canCancel, cancellationDeadline } = calculateCancellationEligibility(booking, booking.startTime);

        return {
            id: booking.id,
            appointmentType: {
                title: booking.appointmentTitle,
                duration: booking.duration
            },
            provider: {
                name: booking.staffName || booking.resourceName,
                type: booking.staffName ? 'STAFF' : 'RESOURCE',
                profileImage: booking.staffImage || booking.resourceImage,
                title: booking.staffTitle
            },
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            venue: booking.venue || booking.location,
            canCancel,
            cancellationDeadline
        };
    });

    return {
        success: true,
        bookings,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get detailed booking information
 */
const getBookingDetailsEnhanced = async (bookingId, userId) => {
    const query = `
        SELECT b.*, at.id as "appointmentTypeId", at.title as "appointmentTitle",
               at.description as "appointmentDescription", at.duration, at.location as "appointmentLocation",
               u."fullName" as "customerName", u.email as "customerEmail", u.phone as "customerPhone",
               sm.id as "staffId", sm.name as "staffName", sm.title as "staffTitle",
               sm.specialization as "staffSpecialization", sm."profileImage" as "staffImage",
               r.id as "resourceId", r.name as "resourceName", r."imageUrl" as "resourceImage",
               p.amount as "paymentAmount", p.status as "paymentStatus",
               p."providerTransactionId", p."createdAt" as "paidAt",
               cp."allowCancellation", cp."cancellationDeadlineHours",
               cp."refundPercentage", cp."cancellationFee"
        FROM "Booking" b
        INNER JOIN "AppointmentType" at ON b."appointmentTypeId" = at.id
        INNER JOIN "User" u ON b."customerId" = u.id
        LEFT JOIN "StaffMember" sm ON b."staffMemberId" = sm.id
        LEFT JOIN "Resource" r ON b."resourceId" = r.id
        LEFT JOIN "Payment" p ON b.id = p."bookingId"
        LEFT JOIN "CancellationPolicy" cp ON at.id = cp."appointmentTypeId"
        WHERE b.id = $1
    `;

    const result = await pool.query(query, [bookingId]);

    if (result.rows.length === 0) {
        throw new AppError('Booking not found', StatusCodes.NOT_FOUND);
    }

    const booking = result.rows[0];

    if (booking.customerId !== userId) {
        throw new AppError('You are not authorized to view this booking', StatusCodes.FORBIDDEN);
    }

    const answersArray = typeof booking.answers === 'string' ? JSON.parse(booking.answers) : booking.answers;
    const formattedAnswers = (answersArray || []).map(ans => ({
        question: ans.questionText || 'Question',
        answer: ans.answer
    }));

    const { canCancel, cancellationDeadline } = calculateCancellationEligibility(booking, booking.startTime);

    return {
        success: true,
        booking: {
            id: booking.id,
            appointmentType: {
                title: booking.appointmentTitle,
                description: booking.appointmentDescription,
                duration: booking.duration,
                location: booking.appointmentLocation
            },
            provider: {
                id: booking.staffId || booking.resourceId,
                name: booking.staffName || booking.resourceName,
                type: booking.staffId ? 'STAFF' : 'RESOURCE',
                specialization: booking.staffSpecialization,
                profileImage: booking.staffImage || booking.resourceImage,
                title: booking.staffTitle
            },
            customer: {
                name: booking.customerName,
                email: booking.customerEmail,
                phone: booking.customerPhone
            },
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            capacity: booking.capacity,
            venue: booking.venue || booking.appointmentLocation,
            notes: booking.notes,
            answers: formattedAnswers,
            payment: booking.paymentAmount ? {
                amount: parseFloat(booking.paymentAmount),
                status: booking.paymentStatus,
                paidAt: booking.paidAt,
                receiptUrl: null
            } : null,
            confirmationMessage: booking.confirmationMessage,
            canCancel,
            cancellationDeadline,
            createdAt: booking.createdAt
        }
    };
};

/**
 * Cancel booking
 */
const cancelBooking = async (bookingId, userId, reason) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const bookingResult = await client.query(
            `SELECT b.*, at.title as "appointmentTitle",
                    u."fullName" as "customerName", u.email as "customerEmail",
                    sm.name as "staffName", r.name as "resourceName",
                    p.id as "paymentId", p.amount as "paymentAmount", p.status as "paymentStatus",
                    cp."allowCancellation", cp."cancellationDeadlineHours",
                    cp."refundPercentage", cp."cancellationFee"
             FROM "Booking" b
             INNER JOIN "AppointmentType" at ON b."appointmentTypeId" = at.id
             INNER JOIN "User" u ON b."customerId" = u.id
             LEFT JOIN "StaffMember" sm ON b."staffMemberId" = sm.id
             LEFT JOIN "Resource" r ON b."resourceId" = r.id
             LEFT JOIN "Payment" p ON b.id = p."bookingId"
             LEFT JOIN "CancellationPolicy" cp ON at.id = cp."appointmentTypeId"
             WHERE b.id = $1 FOR UPDATE`,
            [bookingId]
        );

        if (bookingResult.rows.length === 0) {
            throw new AppError('Booking not found', StatusCodes.NOT_FOUND);
        }

        const booking = bookingResult.rows[0];

        if (booking.customerId !== userId) {
            throw new AppError('You are not authorized to cancel this booking', StatusCodes.FORBIDDEN);
        }

        if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
            throw new AppError(`Cannot cancel booking with status: ${booking.status}`, StatusCodes.BAD_REQUEST);
        }

        if (!booking.allowCancellation) {
            throw new AppError('This booking cannot be cancelled according to the cancellation policy', StatusCodes.BAD_REQUEST);
        }

        const now = new Date();
        const startTime = new Date(booking.startTime);
        const hoursUntilBooking = (startTime - now) / (1000 * 60 * 60);
        const deadlineHours = booking.cancellationDeadlineHours || 24;

        if (hoursUntilBooking <= deadlineHours) {
            throw new AppError(
                `Cancellation deadline has passed. Bookings must be cancelled at least ${deadlineHours} hours in advance.`,
                StatusCodes.BAD_REQUEST
            );
        }

        // Calculate refund
        let refundAmount = 0;
        let refundPercentage = 0;
        let refundStatus = null;

        if (booking.paymentId && booking.paymentStatus === 'SUCCESS') {
            refundPercentage = booking.refundPercentage || 100;
            const cancellationFee = booking.cancellationFee ? parseFloat(booking.cancellationFee) : 0;
            refundAmount = (parseFloat(booking.paymentAmount) * refundPercentage / 100) - cancellationFee;

            if (refundAmount > 0) {
                await client.query(
                    `UPDATE "Payment" SET status = 'REFUNDED', "refundAmount" = $1, "refundReason" = $2,
                            "refundedAt" = NOW(), "updatedAt" = NOW() WHERE id = $3`,
                    [refundAmount, reason, booking.paymentId]
                );
                refundStatus = 'PROCESSING';
            }
        }

        // Update booking
        await client.query(
            `UPDATE "Booking" SET status = 'CANCELLED', "cancellationReason" = $1,
                    "cancelledBy" = $2, "cancelledAt" = NOW(), "updatedAt" = NOW() WHERE id = $3`,
            [reason, userId, bookingId]
        );

        // Create history
        await client.query(
            `INSERT INTO "BookingHistory" (id, "bookingId", action, "performedBy", "oldStatus", "newStatus", reason, "createdAt")
             VALUES (gen_random_uuid(), $1, 'CANCELLED', $2, $3, 'CANCELLED', $4, NOW())`,
            [bookingId, userId, booking.status, reason]
        );

        // Send email
        await sendBookingEmail('cancelled', {
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            appointmentTitle: booking.appointmentTitle,
            providerName: booking.staffName || booking.resourceName,
            date: booking.date,
            startTime: booking.startTime,
            reason,
            refundAmount
        });

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Booking cancelled successfully',
            booking: {
                id: bookingId,
                status: 'CANCELLED',
                cancelledAt: new Date()
            },
            refund: refundAmount > 0 ? {
                amount: refundAmount,
                refundPercentage,
                estimatedProcessingDays: 5,
                refundStatus
            } : null
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Reschedule booking
 */
const rescheduleBooking = async (bookingId, userId, rescheduleData) => {
    const { newDate, newStartTime, providerId, reason } = rescheduleData;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const bookingResult = await client.query(
            `SELECT b.*, at.id as "appointmentTypeId", at.title as "appointmentTitle",
                    at.duration, at."manualConfirmation",
                    u."fullName" as "customerName", u.email as "customerEmail",
                    sm.name as "oldStaffName", r.name as "oldResourceName"
             FROM "Booking" b
             INNER JOIN "AppointmentType" at ON b."appointmentTypeId" = at.id
             INNER JOIN "User" u ON b."customerId" = u.id
             LEFT JOIN "StaffMember" sm ON b."staffMemberId" = sm.id
             LEFT JOIN "Resource" r ON b."resourceId" = r.id
             WHERE b.id = $1 FOR UPDATE`,
            [bookingId]
        );

        if (bookingResult.rows.length === 0) {
            throw new AppError('Booking not found', StatusCodes.NOT_FOUND);
        }

        const booking = bookingResult.rows[0];

        if (booking.customerId !== userId) {
            throw new AppError('You are not authorized to reschedule this booking', StatusCodes.FORBIDDEN);
        }

        if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
            throw new AppError(`Cannot reschedule booking with status: ${booking.status}`, StatusCodes.BAD_REQUEST);
        }

        const newStart = new Date(newStartTime);
        const newEnd = new Date(newStart.getTime() + booking.duration * 60000);
        const providerType = booking.staffMemberId ? 'STAFF' : 'RESOURCE';
        const finalProviderId = providerId || (booking.staffMemberId || booking.resourceId);
        const idCol = providerType === 'RESOURCE' ? '"resourceId"' : '"staffMemberId"';

        // Check availability
        const availabilityResult = await client.query(
            `SELECT COUNT(*) as count FROM "Booking"
             WHERE ${idCol} = $1 AND date = $2::date AND status NOT IN ('CANCELLED')
             AND "startTime" < $4 AND "endTime" > $3 AND id != $5`,
            [finalProviderId, newDate, newStart.toISOString(), newEnd.toISOString(), bookingId]
        );

        if (parseInt(availabilityResult.rows[0].count) > 0) {
            throw new AppError('The selected time slot is not available', StatusCodes.CONFLICT);
        }

        const newStatus = booking.manualConfirmation ? 'PENDING' : booking.status;

        // Update booking
        const updateQuery = providerId
            ? `UPDATE "Booking" SET date = $1, "startTime" = $2, "endTime" = $3, "${idCol.replace(/"/g, '')}" = $4, status = $5, "updatedAt" = NOW() WHERE id = $6 RETURNING *`
            : `UPDATE "Booking" SET date = $1, "startTime" = $2, "endTime" = $3, status = $4, "updatedAt" = NOW() WHERE id = $5 RETURNING *`;

        const updateParams = providerId
            ? [newDate, newStart, newEnd, finalProviderId, newStatus, bookingId]
            : [newDate, newStart, newEnd, newStatus, bookingId];

        const updateResult = await client.query(updateQuery, updateParams);
        const updatedBooking = updateResult.rows[0];

        // Get provider name
        const newProviderName = await getProviderName(client, finalProviderId, providerType);

        // Create history
        await client.query(
            `INSERT INTO "BookingHistory" (id, "bookingId", action, "performedBy", "oldStatus", "newStatus",
                    "oldStartTime", "newStartTime", reason, "createdAt")
             VALUES (gen_random_uuid(), $1, 'RESCHEDULED', $2, $3, $4, $5, $6, $7, NOW())`,
            [bookingId, userId, booking.status, newStatus, booking.startTime, newStart, reason]
        );

        // Send email
        await sendBookingEmail('rescheduled', {
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            appointmentTitle: booking.appointmentTitle,
            providerName: newProviderName,
            date: newDate,
            startTime: newStart,
            endTime: newEnd,
            status: newStatus
        });

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Booking rescheduled successfully',
            booking: {
                id: updatedBooking.id,
                date: updatedBooking.date,
                startTime: updatedBooking.startTime,
                endTime: updatedBooking.endTime,
                status: updatedBooking.status,
                provider: {
                    name: newProviderName
                }
            }
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    createBooking,
    confirmPayment,
    getBookingDetails,
    getMyBookings,
    getBookingDetailsEnhanced,
    cancelBooking,
    rescheduleBooking
};
