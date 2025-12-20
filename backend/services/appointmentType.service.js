const { StatusCodes } = require('http-status-codes');
const crypto = require('crypto');
const { pool } = require('../config/db');
const AppError = require('../utils/appError');

/**
 * Generate unique share link for appointment type
 */
const generateShareLink = () => {
  return crypto.randomBytes(8).toString('hex');
};

/**
 * Create a new appointment type
 */
const createAppointmentType = async (organizerId, data) => {
  const {
    title,
    description,
    duration,
    type,
    location,
    meetingUrl,
    introductoryMessage,
    color,
    maxBookingsPerSlot,
    manageCapacity,
    requiresPayment,
    price,
    manualConfirmation,
    autoAssignment,
    minAdvanceBookingMinutes,
    maxAdvanceBookingDays,
    bufferTimeMinutes,
    confirmationMessage,
    isPublished,
    questions,
    cancellationPolicy,
  } = data;

  // Generate unique share link
  const shareLink = generateShareLink();

  // Create appointment type
  const appointmentTypeResult = await pool.query(
    `INSERT INTO "AppointmentType" 
      ("title", "description", "duration", "type", "location", "meetingUrl", "introductoryMessage", "color", "maxBookingsPerSlot", 
       "manageCapacity", "requiresPayment", "price", "manualConfirmation", "autoAssignment", "minAdvanceBookingMinutes", 
       "maxAdvanceBookingDays", "bufferTimeMinutes", "confirmationMessage", "isPublished", "shareLink", "organizerId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW())
     RETURNING *`,
    [
      title,
      description || null,
      duration,
      type,
      location || null,
      meetingUrl || null,
      introductoryMessage || null,
      color || '#3B82F6',
      maxBookingsPerSlot || 1,
      manageCapacity ?? true,
      requiresPayment || false,
      price || null,
      manualConfirmation || false,
      autoAssignment ?? true,
      minAdvanceBookingMinutes || 120,
      maxAdvanceBookingDays || 30,
      bufferTimeMinutes || 0,
      confirmationMessage || null,
      isPublished || false,
      shareLink,
      organizerId,
    ]
  );

  const appointmentType = appointmentTypeResult.rows[0];

  // Create questions if provided
  if (questions && questions.length > 0) {
    for (const question of questions) {
      await pool.query(
        `INSERT INTO "Question" 
          ("appointmentTypeId", "questionText", "questionType", "options", "isRequired", "order", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          appointmentType.id,
          question.questionText,
          question.questionType,
          question.options ? JSON.stringify(question.options) : null,
          question.isRequired || false,
          question.order || 0,
        ]
      );
    }
  }

  // Create cancellation policy if provided
  if (cancellationPolicy) {
    await pool.query(
      `INSERT INTO "CancellationPolicy"
        ("appointmentTypeId", "allowCancellation", "cancellationDeadlineHours", "refundPercentage", "cancellationFee", "noShowPolicy", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [
        appointmentType.id,
        cancellationPolicy.allowCancellation ?? true,
        cancellationPolicy.cancellationDeadlineHours || 24,
        cancellationPolicy.refundPercentage || 100,
        cancellationPolicy.cancellationFee || null,
        cancellationPolicy.noShowPolicy || null,
      ]
    );
  }

  return {
    id: appointmentType.id,
    title: appointmentType.title,
    description: appointmentType.description,
    duration: appointmentType.duration,
    type: appointmentType.type,
    location: appointmentType.location,
    price: appointmentType.price ? parseFloat(appointmentType.price) : null,
    isPublished: appointmentType.isPublished,
    shareLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/book/${appointmentType.shareLink}`,
    createdAt: appointmentType.createdAt,
    updatedAt: appointmentType.updatedAt,
  };
};

/**
 * List all appointment types for an organiser with filters and pagination
 */
const listAppointmentTypes = async (organizerId, filters) => {
  const { page = 1, limit = 10, search, isPublished, type } = filters;
  const offset = (page - 1) * limit;

  // Build query with filters
  let whereConditions = ['"organizerId" = $1'];
  let queryParams = [organizerId];
  let paramIndex = 2;

  if (search) {
    whereConditions.push(`("title" ILIKE $${paramIndex} OR "description" ILIKE $${paramIndex})`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  if (isPublished !== undefined) {
    whereConditions.push(`"isPublished" = $${paramIndex}`);
    queryParams.push(isPublished === 'true');
    paramIndex++;
  }

  if (type) {
    whereConditions.push(`"type" = $${paramIndex}`);
    queryParams.push(type);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM "AppointmentType" WHERE ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  // Get paginated data
  const dataResult = await pool.query(
    `SELECT "id", "title", "description", "duration", "type", "location", "price", "isPublished", "shareLink", "createdAt", "updatedAt"
     FROM "AppointmentType"
     WHERE ${whereClause}
     ORDER BY "createdAt" DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...queryParams, limit, offset]
  );

  // Get statistics for each appointment type
  const appointmentTypesWithStats = await Promise.all(
    dataResult.rows.map(async (apt) => {
      const totalBookingsResult = await pool.query(
        'SELECT COUNT(*) FROM "Booking" WHERE "appointmentTypeId" = $1',
        [apt.id]
      );

      const upcomingBookingsResult = await pool.query(
        'SELECT COUNT(*) FROM "Booking" WHERE "appointmentTypeId" = $1 AND "startTime" >= NOW() AND "status" != $2',
        [apt.id, 'CANCELLED']
      );

      const revenueResult = await pool.query(
        `SELECT COALESCE(SUM(p."amount"), 0) as revenue
         FROM "Payment" p
         INNER JOIN "Booking" b ON p."bookingId" = b."id"
         WHERE b."appointmentTypeId" = $1 AND p."status" = $2`,
        [apt.id, 'SUCCESS']
      );

      return {
        ...apt,
        price: apt.price ? parseFloat(apt.price) : null,
        statistics: {
          totalBookings: parseInt(totalBookingsResult.rows[0].count),
          upcomingBookings: parseInt(upcomingBookingsResult.rows[0].count),
          revenue: parseFloat(revenueResult.rows[0].revenue),
        },
      };
    })
  );

  return {
    data: appointmentTypesWithStats,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single appointment type details
 */
const getAppointmentTypeById = async (organizerId, appointmentTypeId) => {
  // Get appointment type
  const appointmentTypeResult = await pool.query(
    'SELECT * FROM "AppointmentType" WHERE "id" = $1 AND "organizerId" = $2',
    [appointmentTypeId, organizerId]
  );

  if (appointmentTypeResult.rows.length === 0) {
    throw new AppError('Appointment type not found', StatusCodes.NOT_FOUND);
  }

  const appointmentType = appointmentTypeResult.rows[0];

  // Get questions
  const questionsResult = await pool.query(
    'SELECT "id", "questionText", "questionType", "options", "isRequired", "order" FROM "Question" WHERE "appointmentTypeId" = $1 ORDER BY "order"',
    [appointmentTypeId]
  );

  // Get cancellation policy
  const policyResult = await pool.query(
    'SELECT "id", "allowCancellation", "cancellationDeadlineHours", "refundPercentage", "cancellationFee", "noShowPolicy" FROM "CancellationPolicy" WHERE "appointmentTypeId" = $1',
    [appointmentTypeId]
  );

  // Get working hours
  const workingHoursResult = await pool.query(
    'SELECT "id", "dayOfWeek", "isWorking", "startTime", "endTime", "breakStart", "breakEnd" FROM "WorkingHours" WHERE "appointmentTypeId" = $1 ORDER BY "dayOfWeek"',
    [appointmentTypeId]
  );

  // Get booking statistics
  const totalBookingsResult = await pool.query(
    'SELECT COUNT(*) FROM "Booking" WHERE "appointmentTypeId" = $1',
    [appointmentTypeId]
  );

  const completedBookingsResult = await pool.query(
    'SELECT COUNT(*) FROM "Booking" WHERE "appointmentTypeId" = $1 AND "status" = $2',
    [appointmentTypeId, 'COMPLETED']
  );

  const totalBookings = parseInt(totalBookingsResult.rows[0].count);
  const completedBookings = parseInt(completedBookingsResult.rows[0].count);
  const completionRate = totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0;

  const averageRatingResult = await pool.query(
    `SELECT AVG("rating") as "averageRating" 
     FROM "Review" r
     INNER JOIN "Booking" b ON r."bookingId" = b."id"
     WHERE b."appointmentTypeId" = $1`,
    [appointmentTypeId]
  );

  const revenueResult = await pool.query(
    `SELECT COALESCE(SUM(p."amount"), 0) as revenue
     FROM "Payment" p
     INNER JOIN "Booking" b ON p."bookingId" = b."id"
     WHERE b."appointmentTypeId" = $1 AND p."status" = $2`,
    [appointmentTypeId, 'SUCCESS']
  );

  return {
    id: appointmentType.id,
    title: appointmentType.title,
    description: appointmentType.description,
    duration: appointmentType.duration,
    type: appointmentType.type,
    location: appointmentType.location,
    meetingUrl: appointmentType.meetingUrl,
    introductoryMessage: appointmentType.introductoryMessage,
    color: appointmentType.color,
    maxBookingsPerSlot: appointmentType.maxBookingsPerSlot,
    manageCapacity: appointmentType.manageCapacity,
    requiresPayment: appointmentType.requiresPayment,
    price: appointmentType.price ? parseFloat(appointmentType.price) : null,
    manualConfirmation: appointmentType.manualConfirmation,
    autoAssignment: appointmentType.autoAssignment,
    minAdvanceBookingMinutes: appointmentType.minAdvanceBookingMinutes,
    maxAdvanceBookingDays: appointmentType.maxAdvanceBookingDays,
    bufferTimeMinutes: appointmentType.bufferTimeMinutes,
    confirmationMessage: appointmentType.confirmationMessage,
    isPublished: appointmentType.isPublished,
    shareLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/book/${appointmentType.shareLink}`,
    organizerId: appointmentType.organizerId,
    createdAt: appointmentType.createdAt,
    updatedAt: appointmentType.updatedAt,
    questions: questionsResult.rows.map(q => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : null,
    })),
    cancellationPolicy: policyResult.rows[0] || null,
    workingHours: workingHoursResult.rows,
    statistics: {
      totalBookings,
      completionRate: parseFloat(completionRate),
      averageRating: averageRatingResult.rows[0].averageRating
        ? parseFloat(averageRatingResult.rows[0].averageRating).toFixed(1)
        : null,
      revenue: parseFloat(revenueResult.rows[0].revenue),
    },
  };
};

/**
 * Update appointment type details
 */
const updateAppointmentType = async (organizerId, appointmentTypeId, data) => {
  // Verify appointment type belongs to organiser
  const existingResult = await pool.query(
    'SELECT * FROM "AppointmentType" WHERE "id" = $1 AND "organizerId" = $2',
    [appointmentTypeId, organizerId]
  );

  if (existingResult.rows.length === 0) {
    throw new AppError('Appointment type not found', StatusCodes.NOT_FOUND);
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
    UPDATE "AppointmentType"
    SET ${updateFields.join(', ')}
    WHERE "id" = $${paramIndex} AND "organizerId" = $${paramIndex + 1}
    RETURNING *
  `;

  const result = await pool.query(updateQuery, [...updateValues, appointmentTypeId, organizerId]);

  const appointmentType = result.rows[0];

  return {
    id: appointmentType.id,
    title: appointmentType.title,
    description: appointmentType.description,
    duration: appointmentType.duration,
    type: appointmentType.type,
    price: appointmentType.price ? parseFloat(appointmentType.price) : null,
    isPublished: appointmentType.isPublished,
    updatedAt: appointmentType.updatedAt,
  };
};

/**
 * Publish appointment type
 */
const publishAppointmentType = async (organizerId, appointmentTypeId) => {
  // Verify appointment type belongs to organiser
  const existingResult = await pool.query(
    'SELECT * FROM "AppointmentType" WHERE "id" = $1 AND "organizerId" = $2',
    [appointmentTypeId, organizerId]
  );

  if (existingResult.rows.length === 0) {
    throw new AppError('Appointment type not found', StatusCodes.NOT_FOUND);
  }

  // Update to published
  const result = await pool.query(
    'UPDATE "AppointmentType" SET "isPublished" = TRUE, "updatedAt" = NOW() WHERE "id" = $1 RETURNING *',
    [appointmentTypeId]
  );

  return {
    id: result.rows[0].id,
    title: result.rows[0].title,
    isPublished: result.rows[0].isPublished,
    message: 'Appointment type published successfully',
  };
};

/**
 * Unpublish appointment type
 */
const unpublishAppointmentType = async (organizerId, appointmentTypeId) => {
  // Verify appointment type belongs to organiser
  const existingResult = await pool.query(
    'SELECT * FROM "AppointmentType" WHERE "id" = $1 AND "organizerId" = $2',
    [appointmentTypeId, organizerId]
  );

  if (existingResult.rows.length === 0) {
    throw new AppError('Appointment type not found', StatusCodes.NOT_FOUND);
  }

  // Check for upcoming bookings
  const upcomingBookingsResult = await pool.query(
    'SELECT COUNT(*) FROM "Booking" WHERE "appointmentTypeId" = $1 AND "startTime" >= NOW() AND "status" IN ($2, $3)',
    [appointmentTypeId, 'PENDING', 'CONFIRMED']
  );

  const upcomingCount = parseInt(upcomingBookingsResult.rows[0].count);

  // Generate new share link
  const newShareLink = generateShareLink();

  // Update to unpublished with new share link
  const result = await pool.query(
    'UPDATE "AppointmentType" SET "isPublished" = FALSE, "shareLink" = $1, "updatedAt" = NOW() WHERE "id" = $2 RETURNING *',
    [newShareLink, appointmentTypeId]
  );

  return {
    id: result.rows[0].id,
    title: result.rows[0].title,
    isPublished: result.rows[0].isPublished,
    shareLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/book/${result.rows[0].shareLink}`,
    upcomingBookings: upcomingCount,
    message: 'Appointment type unpublished successfully',
  };
};

/**
 * Delete appointment type
 */
const deleteAppointmentType = async (organizerId, appointmentTypeId) => {
  // Verify appointment type belongs to organiser
  const existingResult = await pool.query(
    'SELECT * FROM "AppointmentType" WHERE "id" = $1 AND "organizerId" = $2',
    [appointmentTypeId, organizerId]
  );

  if (existingResult.rows.length === 0) {
    throw new AppError('Appointment type not found', StatusCodes.NOT_FOUND);
  }

  // Check for existing bookings
  const bookingsResult = await pool.query(
    'SELECT COUNT(*) FROM "Booking" WHERE "appointmentTypeId" = $1',
    [appointmentTypeId]
  );

  const bookingsCount = parseInt(bookingsResult.rows[0].count);

  if (bookingsCount > 0) {
    throw new AppError(
      `Cannot delete appointment type with ${bookingsCount} existing bookings. Please cancel all bookings first.`,
      StatusCodes.CONFLICT
    );
  }

  // Delete appointment type (cascade will delete questions, policy, working hours, slots, exceptions)
  await pool.query('DELETE FROM "AppointmentType" WHERE "id" = $1', [appointmentTypeId]);

  return {
    message: 'Appointment type deleted successfully',
  };
};

module.exports = {
  createAppointmentType,
  listAppointmentTypes,
  getAppointmentTypeById,
  updateAppointmentType,
  publishAppointmentType,
  unpublishAppointmentType,
  deleteAppointmentType,
};
