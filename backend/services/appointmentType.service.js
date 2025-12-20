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
    workingHours,
  } = data;

  // Generate unique share link
  const shareLink = generateShareLink();
  const id = crypto.randomUUID();

  // Create appointment type
  // PATCH: Added "questions" column and value
  const appointmentTypeResult = await pool.query(
    `INSERT INTO "AppointmentType" 
      ("id", "title", "description", "duration", "type", "location", "meetingUrl", "introductoryMessage", "color", "maxBookingsPerSlot", 
       "manageCapacity", "requiresPayment", "price", "manualConfirmation", "autoAssignment", "minAdvanceBookingMinutes", 
       "maxAdvanceBookingDays", "bufferTimeMinutes", "confirmationMessage", "isPublished", "questions", "shareLink", "organizerId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW())
     RETURNING *`,
    [
      id,
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
      questions ? JSON.stringify(questions) : null,
      shareLink,
      organizerId,
    ]
  );

  const appointmentType = appointmentTypeResult.rows[0];

  // Create questions if provided
  if (questions && questions.length > 0) {
    for (const question of questions) {
      const qId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO "Question" 
          ("id", "appointmentTypeId", "questionText", "questionType", "options", "isRequired", "order", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          qId,
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
    const pId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO "CancellationPolicy"
        ("id", "appointmentTypeId", "allowCancellation", "cancellationDeadlineHours", "refundPercentage", "cancellationFee", "noShowPolicy", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        pId,
        appointmentType.id,
        cancellationPolicy.allowCancellation ?? true,
        cancellationPolicy.cancellationDeadlineHours || 24,
        cancellationPolicy.refundPercentage || 100,
        cancellationPolicy.cancellationFee || null,
        cancellationPolicy.noShowPolicy || null,
      ]
    );
  }

  // Create working hours if provided
  if (workingHours && workingHours.length > 0) {
    for (const wh of workingHours) {
      const whId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO "WorkingHours"
          ("id", "appointmentTypeId", "dayOfWeek", "isWorking", "startTime", "endTime", "breakStart", "breakEnd", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          whId,
          appointmentType.id,
          wh.dayOfWeek,
          wh.isWorking,
          wh.startTime,
          wh.endTime,
          wh.breakStart || null,
          wh.breakEnd || null,
        ]
      );
    }
  } else {
    // Default 9-5 Mon-Fri if not provided
    for (let i = 1; i <= 5; i++) {
      const whId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO "WorkingHours"
              ("id", "appointmentTypeId", "dayOfWeek", "isWorking", "startTime", "endTime", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, true, '09:00', '17:00', NOW(), NOW())`,
        [whId, appointmentType.id, i]
      );
    }
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

  const { questions, cancellationPolicy, workingHours, ...updateData } = data;

  // Build update query dynamically
  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;

  if (Object.keys(updateData).length > 0) {
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length > 0) {
      updateFields.push(`"updatedAt" = NOW()`);

      const updateQuery = `
          UPDATE "AppointmentType"
          SET ${updateFields.join(', ')}
          WHERE "id" = $${paramIndex} AND "organizerId" = $${paramIndex + 1}
          RETURNING *
        `;

      await pool.query(updateQuery, [...updateValues, appointmentTypeId, organizerId]);
    }
  }

  // Update questions
  if (questions) {
    // Delete existing questions
    await pool.query('DELETE FROM "Question" WHERE "appointmentTypeId" = $1', [appointmentTypeId]);

    // Insert new questions
    for (const question of questions) {
      const qId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO "Question" 
            ("id", "appointmentTypeId", "questionText", "questionType", "options", "isRequired", "order", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          qId,
          appointmentTypeId,
          question.questionText,
          question.questionType,
          question.options ? JSON.stringify(question.options) : null,
          question.isRequired || false,
          question.order || 0,
        ]
      );
    }

    // PATCH: Also update JSON column for backward compatibility
    await pool.query(
      'UPDATE "AppointmentType" SET "questions" = $1, "updatedAt" = NOW() WHERE "id" = $2',
      [JSON.stringify(questions), appointmentTypeId]
    );
  }

  // Update cancellation policy
  if (cancellationPolicy) {
    // Check if exists
    const existingPolicy = await pool.query('SELECT id FROM "CancellationPolicy" WHERE "appointmentTypeId" = $1', [appointmentTypeId]);

    if (existingPolicy.rows.length > 0) {
      await pool.query(
        `UPDATE "CancellationPolicy" 
               SET "allowCancellation" = $1, "cancellationDeadlineHours" = $2, "refundPercentage" = $3, 
                   "cancellationFee" = $4, "noShowPolicy" = $5, "updatedAt" = NOW()
               WHERE "appointmentTypeId" = $6`,
        [
          cancellationPolicy.allowCancellation ?? true,
          cancellationPolicy.cancellationDeadlineHours || 24,
          cancellationPolicy.refundPercentage || 100,
          cancellationPolicy.cancellationFee || null,
          cancellationPolicy.noShowPolicy || null,
          appointmentTypeId
        ]
      );
    } else {
      const pId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO "CancellationPolicy"
              ("id", "appointmentTypeId", "allowCancellation", "cancellationDeadlineHours", "refundPercentage", "cancellationFee", "noShowPolicy", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          pId,
          appointmentTypeId,
          cancellationPolicy.allowCancellation ?? true,
          cancellationPolicy.cancellationDeadlineHours || 24,
          cancellationPolicy.refundPercentage || 100,
          cancellationPolicy.cancellationFee || null,
          cancellationPolicy.noShowPolicy || null,
        ]
      );
    }
  }

  // Update working hours
  if (workingHours) {
    // Delete existing
    await pool.query('DELETE FROM "WorkingHours" WHERE "appointmentTypeId" = $1', [appointmentTypeId]);

    // Insert new
    for (const wh of workingHours) {
      const whId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO "WorkingHours"
            ("id", "appointmentTypeId", "dayOfWeek", "isWorking", "startTime", "endTime", "breakStart", "breakEnd", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          whId,
          appointmentTypeId,
          wh.dayOfWeek,
          wh.isWorking,
          wh.startTime,
          wh.endTime,
          wh.breakStart || null,
          wh.breakEnd || null,
        ]
      );
    }
  }

  // Fetch updated object to return
  return await getAppointmentTypeById(organizerId, appointmentTypeId);
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

/**
 * Set or update cancellation policy for appointment type
 */
const setCancellationPolicy = async (organizerId, appointmentTypeId, policyData) => {
  const { allowCancellation, cancellationDeadlineHours, refundPercentage, cancellationFee, noShowPolicy } = policyData;

  // Verify appointment type exists and belongs to organiser
  const appointmentTypeResult = await pool.query(
    'SELECT * FROM "AppointmentType" WHERE "id" = $1 AND "organizerId" = $2',
    [appointmentTypeId, organizerId]
  );

  if (appointmentTypeResult.rows.length === 0) {
    throw new AppError('Appointment type not found or access denied', StatusCodes.NOT_FOUND);
  }

  // Check if cancellation policy already exists
  const existingPolicyResult = await pool.query(
    'SELECT * FROM "CancellationPolicy" WHERE "appointmentTypeId" = $1',
    [appointmentTypeId]
  );

  let policy;

  if (existingPolicyResult.rows.length > 0) {
    // Update existing policy
    const updateResult = await pool.query(
      `UPDATE "CancellationPolicy" 
       SET "allowCancellation" = $1, "cancellationDeadlineHours" = $2, "refundPercentage" = $3, 
           "cancellationFee" = $4, "noShowPolicy" = $5, "updatedAt" = NOW()
       WHERE "appointmentTypeId" = $6
       RETURNING *`,
      [allowCancellation, cancellationDeadlineHours, refundPercentage, cancellationFee, noShowPolicy, appointmentTypeId]
    );
    policy = updateResult.rows[0];
  } else {
    // Create new policy
    const pId = crypto.randomUUID();
    const createResult = await pool.query(
      `INSERT INTO "CancellationPolicy" 
        ("id", "allowCancellation", "cancellationDeadlineHours", "refundPercentage", "cancellationFee", "noShowPolicy", "appointmentTypeId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [pId, allowCancellation, cancellationDeadlineHours, refundPercentage, cancellationFee, noShowPolicy, appointmentTypeId]
    );
    policy = createResult.rows[0];
  }

  return policy;
};

/**
 * Get cancellation policy for appointment type
 */
const getCancellationPolicy = async (organizerId, appointmentTypeId) => {
  // Verify appointment type exists and belongs to organiser
  const appointmentTypeResult = await pool.query(
    'SELECT * FROM "AppointmentType" WHERE "id" = $1 AND "organizerId" = $2',
    [appointmentTypeId, organizerId]
  );

  if (appointmentTypeResult.rows.length === 0) {
    throw new AppError('Appointment type not found or access denied', StatusCodes.NOT_FOUND);
  }

  // Fetch cancellation policy
  const policyResult = await pool.query(
    'SELECT * FROM "CancellationPolicy" WHERE "appointmentTypeId" = $1',
    [appointmentTypeId]
  );

  if (policyResult.rows.length === 0) {
    // Return default policy if none exists
    return {
      allowCancellation: true,
      cancellationDeadlineHours: 24,
      refundPercentage: 100,
      cancellationFee: 0,
      noShowPolicy: null,
    };
  }

  return policyResult.rows[0];
};

/**
 * Add a question to an appointment type
 */
const addQuestion = async (organizerId, appointmentTypeId, questionData) => {
  const { questionText, questionType, options, isRequired, order } = questionData;

  // Verify appointment type exists and belongs to organiser
  const appointmentTypeResult = await pool.query(
    'SELECT * FROM "AppointmentType" WHERE "id" = $1 AND "organizerId" = $2',
    [appointmentTypeId, organizerId]
  );

  if (appointmentTypeResult.rows.length === 0) {
    throw new AppError('Appointment type not found or access denied', StatusCodes.NOT_FOUND);
  }

  // Create the question
  const questionResult = await pool.query(
    `INSERT INTO "Question" 
      ("questionText", "questionType", "options", "isRequired", "order", "appointmentTypeId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING *`,
    [questionText, questionType, options ? JSON.stringify(options) : null, isRequired, order, appointmentTypeId]
  );

  const question = questionResult.rows[0];

  // Parse options JSON if exists
  if (question.options) {
    question.options = JSON.parse(question.options);
  }

  return question;
};

/**
 * List all questions for an appointment type
 */
const listQuestions = async (organizerId, appointmentTypeId) => {
  // Verify appointment type exists and belongs to organiser
  const appointmentTypeResult = await pool.query(
    'SELECT * FROM "AppointmentType" WHERE "id" = $1 AND "organizerId" = $2',
    [appointmentTypeId, organizerId]
  );

  if (appointmentTypeResult.rows.length === 0) {
    throw new AppError('Appointment type not found or access denied', StatusCodes.NOT_FOUND);
  }

  // Fetch all questions ordered by order field
  const questionsResult = await pool.query(
    'SELECT * FROM "Question" WHERE "appointmentTypeId" = $1 ORDER BY "order" ASC, "createdAt" ASC',
    [appointmentTypeId]
  );

  // Parse options JSON for each question
  const questions = questionsResult.rows.map(question => {
    if (question.options) {
      question.options = JSON.parse(question.options);
    }
    return question;
  });

  return questions;
};

/**
 * Update a question
 */
const updateQuestion = async (organizerId, appointmentTypeId, questionId, updateData) => {
  // Verify appointment type exists and belongs to organiser
  const appointmentTypeResult = await pool.query(
    'SELECT * FROM "AppointmentType" WHERE "id" = $1 AND "organizerId" = $2',
    [appointmentTypeId, organizerId]
  );

  if (appointmentTypeResult.rows.length === 0) {
    throw new AppError('Appointment type not found or access denied', StatusCodes.NOT_FOUND);
  }

  // Verify question exists and belongs to this appointment type
  const questionResult = await pool.query(
    'SELECT * FROM "Question" WHERE "id" = $1 AND "appointmentTypeId" = $2',
    [questionId, appointmentTypeId]
  );

  if (questionResult.rows.length === 0) {
    throw new AppError('Question not found', StatusCodes.NOT_FOUND);
  }

  // Build dynamic update query
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (updateData.questionText !== undefined) {
    updates.push(`"questionText" = $${paramCount}`);
    values.push(updateData.questionText);
    paramCount++;
  }

  if (updateData.questionType !== undefined) {
    updates.push(`"questionType" = $${paramCount}`);
    values.push(updateData.questionType);
    paramCount++;
  }

  if (updateData.options !== undefined) {
    updates.push(`"options" = $${paramCount}`);
    values.push(updateData.options ? JSON.stringify(updateData.options) : null);
    paramCount++;
  }

  if (updateData.isRequired !== undefined) {
    updates.push(`"isRequired" = $${paramCount}`);
    values.push(updateData.isRequired);
    paramCount++;
  }

  if (updateData.order !== undefined) {
    updates.push(`"order" = $${paramCount}`);
    values.push(updateData.order);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', StatusCodes.BAD_REQUEST);
  }

  updates.push(`"updatedAt" = NOW()`);
  values.push(questionId);

  const updateQuery = `
    UPDATE "Question"
    SET ${updates.join(', ')}
    WHERE "id" = $${paramCount}
    RETURNING *
  `;

  const updatedQuestionResult = await pool.query(updateQuery, values);
  const updatedQuestion = updatedQuestionResult.rows[0];

  // Parse options JSON if exists
  if (updatedQuestion.options) {
    updatedQuestion.options = JSON.parse(updatedQuestion.options);
  }

  return updatedQuestion;
};

/**
 * Delete a question
 */
const deleteQuestion = async (organizerId, appointmentTypeId, questionId) => {
  // Verify appointment type exists and belongs to organiser
  const appointmentTypeResult = await pool.query(
    'SELECT * FROM "AppointmentType" WHERE "id" = $1 AND "organizerId" = $2',
    [appointmentTypeId, organizerId]
  );

  if (appointmentTypeResult.rows.length === 0) {
    throw new AppError('Appointment type not found or access denied', StatusCodes.NOT_FOUND);
  }

  // Verify question exists and belongs to this appointment type
  const questionResult = await pool.query(
    'SELECT * FROM "Question" WHERE "id" = $1 AND "appointmentTypeId" = $2',
    [questionId, appointmentTypeId]
  );

  if (questionResult.rows.length === 0) {
    throw new AppError('Question not found', StatusCodes.NOT_FOUND);
  }

  // Delete the question
  await pool.query('DELETE FROM "Question" WHERE "id" = $1', [questionId]);

  return {
    message: 'Question deleted successfully',
  };
};

/**
 * Reorder questions
 */
const reorderQuestions = async (organizerId, appointmentTypeId, questionIds) => {
  // Verify appointment type exists and belongs to organiser
  const appointmentTypeResult = await pool.query(
    'SELECT * FROM "AppointmentType" WHERE "id" = $1 AND "organizerId" = $2',
    [appointmentTypeId, organizerId]
  );

  if (appointmentTypeResult.rows.length === 0) {
    throw new AppError('Appointment type not found or access denied', StatusCodes.NOT_FOUND);
  }

  // Verify all questions exist and belong to this appointment type
  const questionsResult = await pool.query(
    'SELECT "id" FROM "Question" WHERE "id" = ANY($1) AND "appointmentTypeId" = $2',
    [questionIds, appointmentTypeId]
  );

  if (questionsResult.rows.length !== questionIds.length) {
    throw new AppError('One or more questions not found or do not belong to this appointment type', StatusCodes.BAD_REQUEST);
  }

  // Update the order for each question
  for (let i = 0; i < questionIds.length; i++) {
    await pool.query(
      'UPDATE "Question" SET "order" = $1, "updatedAt" = NOW() WHERE "id" = $2',
      [i, questionIds[i]]
    );
  }

  return {
    message: 'Questions reordered successfully',
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
  setCancellationPolicy,
  getCancellationPolicy,
  addQuestion,
  listQuestions,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
};
