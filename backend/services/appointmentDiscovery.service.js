const { pool } = require('../config/db');
const AppError = require('../utils/appError');
const { StatusCodes } = require('http-status-codes');

/**
 * Calculate average rating for an organizer
 */
const calculateOrganizerRating = async (organizerId) => {
  const ratingQuery = `
    SELECT AVG(r.rating)::numeric(10,2) as avg_rating, COUNT(r.id) as review_count
    FROM "Review" r
    INNER JOIN "Booking" b ON r."bookingId" = b.id
    INNER JOIN "AppointmentType" at ON b."appointmentTypeId" = at.id
    WHERE at."organizerId" = $1
  `;
  
  const result = await pool.query(ratingQuery, [organizerId]);
  const avgRating = result.rows[0]?.avg_rating 
    ? parseFloat(result.rows[0].avg_rating) 
    : null;
  const reviewCount = parseInt(result.rows[0]?.review_count || 0);
  
  return { rating: avgRating, reviewCount };
};

/**
 * Get all published appointment types with filters
 */
const getAvailableAppointments = async ({
  page = 1,
  limit = 10,
  search,
  minPrice,
  maxPrice,
  duration,
  type,
}) => {
  const offset = (page - 1) * limit;
  const conditions = ['at."isPublished" = TRUE'];
  const params = [];
  let paramIndex = 1;

  // Search filter
  if (search) {
    conditions.push(`(at.title ILIKE $${paramIndex} OR at.description ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Price filters
  if (minPrice !== undefined && minPrice !== null) {
    conditions.push(`at.price >= $${paramIndex}`);
    params.push(minPrice);
    paramIndex++;
  }

  if (maxPrice !== undefined && maxPrice !== null) {
    conditions.push(`at.price <= $${paramIndex}`);
    params.push(maxPrice);
    paramIndex++;
  }

  // Duration filter
  if (duration !== undefined && duration !== null) {
    conditions.push(`at.duration = $${paramIndex}`);
    params.push(duration);
    paramIndex++;
  }

  // Type filter
  if (type) {
    conditions.push(`at.type = $${paramIndex}`);
    params.push(type);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM "AppointmentType" at
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get appointments with organizer info
  const dataQuery = `
    SELECT 
      at.id,
      at.title,
      at.description,
      at.duration,
      at.type,
      at.price,
      at.location,
      at."meetingUrl",
      at.color,
      at."introductoryMessage",
      at."confirmationMessage",
      at."requiresPayment",
      at."manualConfirmation",
      at."maxBookingsPerSlot",
      at."manageCapacity",
      u.id as "organizerId",
      u."fullName" as "organizerName",
      u."profileImage" as "organizerImage"
    FROM "AppointmentType" at
    INNER JOIN "User" u ON at."organizerId" = u.id
    ${whereClause}
    ORDER BY at."createdAt" DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);
  
  const dataResult = await pool.query(dataQuery, params);
  const appointments = dataResult.rows;

  // Calculate ratings for each organizer
  const appointmentsWithRating = await Promise.all(
    appointments.map(async (appointment) => {
      const { rating, reviewCount } = await calculateOrganizerRating(appointment.organizerId);
      
      return {
        id: appointment.id,
        title: appointment.title,
        description: appointment.description,
        duration: appointment.duration,
        type: appointment.type,
        price: appointment.price ? parseFloat(appointment.price) : null,
        location: appointment.location,
        meetingUrl: appointment.meetingUrl,
        color: appointment.color,
        introductoryMessage: appointment.introductoryMessage,
        confirmationMessage: appointment.confirmationMessage,
        requiresPayment: appointment.requiresPayment,
        manualConfirmation: appointment.manualConfirmation,
        organizer: {
          id: appointment.organizerId,
          name: appointment.organizerName,
          image: appointment.organizerImage,
          rating: rating,
          reviewCount: reviewCount,
        },
      };
    })
  );

  return {
    success: true,
    data: appointmentsWithRating,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get appointment type full details by ID
 */
const getAppointmentDetails = async (appointmentId) => {
  // Get appointment type with organizer info
  const appointmentQuery = `
    SELECT 
      at.id,
      at.title,
      at.description,
      at.duration,
      at.type,
      at.price,
      at.location,
      at."meetingUrl",
      at.color,
      at."introductoryMessage",
      at."confirmationMessage",
      at."requiresPayment",
      at."manualConfirmation",
      at."autoAssignment",
      at."maxBookingsPerSlot",
      at."manageCapacity",
      at."minAdvanceBookingMinutes",
      at."maxAdvanceBookingDays",
      at."bufferTimeMinutes",
      u.id as "organizerId",
      u."fullName" as "organizerName",
      u."profileImage" as "organizerImage",
      u.email as "organizerEmail"
    FROM "AppointmentType" at
    INNER JOIN "User" u ON at."organizerId" = u.id
    WHERE at.id = $1 AND at."isPublished" = TRUE
  `;

  const appointmentResult = await pool.query(appointmentQuery, [appointmentId]);
  
  if (appointmentResult.rows.length === 0) {
    throw new AppError('Appointment type not found or not published', StatusCodes.NOT_FOUND);
  }

  const appointment = appointmentResult.rows[0];

  // Get questions
  const questionsQuery = `
    SELECT 
      id,
      "questionText",
      "questionType",
      options,
      "isRequired",
      "order"
    FROM "Question"
    WHERE "appointmentTypeId" = $1
    ORDER BY "order" ASC
  `;
  const questionsResult = await pool.query(questionsQuery, [appointmentId]);
  const questions = questionsResult.rows.map(q => ({
    id: q.id,
    questionText: q.questionText,
    questionType: q.questionType,
    options: q.options,
    isRequired: q.isRequired,
    order: q.order,
  }));

  // Get cancellation policy
  const policyQuery = `
    SELECT 
      "allowCancellation",
      "cancellationDeadlineHours",
      "refundPercentage",
      "cancellationFee",
      "noShowPolicy"
    FROM "CancellationPolicy"
    WHERE "appointmentTypeId" = $1
  `;
  const policyResult = await pool.query(policyQuery, [appointmentId]);
  const cancellationPolicy = policyResult.rows.length > 0 ? {
    allowCancellation: policyResult.rows[0].allowCancellation,
    cancellationDeadlineHours: policyResult.rows[0].cancellationDeadlineHours,
    refundPercentage: policyResult.rows[0].refundPercentage,
    cancellationFee: policyResult.rows[0].cancellationFee 
      ? parseFloat(policyResult.rows[0].cancellationFee) 
      : null,
    noShowPolicy: policyResult.rows[0].noShowPolicy,
  } : null;

  // Calculate organizer rating
  const { rating, reviewCount } = await calculateOrganizerRating(appointment.organizerId);

  return {
    success: true,
    appointmentType: {
      id: appointment.id,
      title: appointment.title,
      description: appointment.description,
      duration: appointment.duration,
      type: appointment.type,
      price: appointment.price ? parseFloat(appointment.price) : null,
      location: appointment.location,
      meetingUrl: appointment.meetingUrl,
      color: appointment.color,
      introductoryMessage: appointment.introductoryMessage,
      confirmationMessage: appointment.confirmationMessage,
      requiresPayment: appointment.requiresPayment,
      manualConfirmation: appointment.manualConfirmation,
      autoAssignment: appointment.autoAssignment,
      maxBookingsPerSlot: appointment.maxBookingsPerSlot,
      manageCapacity: appointment.manageCapacity,
      minAdvanceBookingMinutes: appointment.minAdvanceBookingMinutes,
      maxAdvanceBookingDays: appointment.maxAdvanceBookingDays,
      bufferTimeMinutes: appointment.bufferTimeMinutes,
      organizer: {
        id: appointment.organizerId,
        name: appointment.organizerName,
        email: appointment.organizerEmail,
        image: appointment.organizerImage,
        rating: rating,
        reviewCount: reviewCount,
      },
      questions: questions,
      cancellationPolicy: cancellationPolicy,
    },
  };
};

/**
 * Get appointment type by share link (even if unpublished)
 */
const getAppointmentByShareLink = async (shareLink) => {
  // Get appointment type with organizer info
  const appointmentQuery = `
    SELECT 
      at.id,
      at.title,
      at.description,
      at.duration,
      at.type,
      at.price,
      at.location,
      at."meetingUrl",
      at.color,
      at."introductoryMessage",
      at."confirmationMessage",
      at."requiresPayment",
      at."manualConfirmation",
      at."autoAssignment",
      at."maxBookingsPerSlot",
      at."manageCapacity",
      at."minAdvanceBookingMinutes",
      at."maxAdvanceBookingDays",
      at."bufferTimeMinutes",
      at."isPublished",
      u.id as "organizerId",
      u."fullName" as "organizerName",
      u."profileImage" as "organizerImage",
      u.email as "organizerEmail"
    FROM "AppointmentType" at
    INNER JOIN "User" u ON at."organizerId" = u.id
    WHERE at."shareLink" = $1
  `;

  const appointmentResult = await pool.query(appointmentQuery, [shareLink]);
  
  if (appointmentResult.rows.length === 0) {
    throw new AppError('Appointment type not found', StatusCodes.NOT_FOUND);
  }

  const appointment = appointmentResult.rows[0];

  // Get questions
  const questionsQuery = `
    SELECT 
      id,
      "questionText",
      "questionType",
      options,
      "isRequired",
      "order"
    FROM "Question"
    WHERE "appointmentTypeId" = $1
    ORDER BY "order" ASC
  `;
  const questionsResult = await pool.query(questionsQuery, [appointment.id]);
  const questions = questionsResult.rows.map(q => ({
    id: q.id,
    questionText: q.questionText,
    questionType: q.questionType,
    options: q.options,
    isRequired: q.isRequired,
    order: q.order,
  }));

  // Get cancellation policy
  const policyQuery = `
    SELECT 
      "allowCancellation",
      "cancellationDeadlineHours",
      "refundPercentage",
      "cancellationFee",
      "noShowPolicy"
    FROM "CancellationPolicy"
    WHERE "appointmentTypeId" = $1
  `;
  const policyResult = await pool.query(policyQuery, [appointment.id]);
  const cancellationPolicy = policyResult.rows.length > 0 ? {
    allowCancellation: policyResult.rows[0].allowCancellation,
    cancellationDeadlineHours: policyResult.rows[0].cancellationDeadlineHours,
    refundPercentage: policyResult.rows[0].refundPercentage,
    cancellationFee: policyResult.rows[0].cancellationFee 
      ? parseFloat(policyResult.rows[0].cancellationFee) 
      : null,
    noShowPolicy: policyResult.rows[0].noShowPolicy,
  } : null;

  // Calculate organizer rating
  const { rating, reviewCount } = await calculateOrganizerRating(appointment.organizerId);

  return {
    success: true,
    appointmentType: {
      id: appointment.id,
      title: appointment.title,
      description: appointment.description,
      duration: appointment.duration,
      type: appointment.type,
      price: appointment.price ? parseFloat(appointment.price) : null,
      location: appointment.location,
      meetingUrl: appointment.meetingUrl,
      color: appointment.color,
      introductoryMessage: appointment.introductoryMessage,
      confirmationMessage: appointment.confirmationMessage,
      requiresPayment: appointment.requiresPayment,
      manualConfirmation: appointment.manualConfirmation,
      autoAssignment: appointment.autoAssignment,
      maxBookingsPerSlot: appointment.maxBookingsPerSlot,
      manageCapacity: appointment.manageCapacity,
      minAdvanceBookingMinutes: appointment.minAdvanceBookingMinutes,
      maxAdvanceBookingDays: appointment.maxAdvanceBookingDays,
      bufferTimeMinutes: appointment.bufferTimeMinutes,
      isPublished: appointment.isPublished,
      organizer: {
        id: appointment.organizerId,
        name: appointment.organizerName,
        email: appointment.organizerEmail,
        image: appointment.organizerImage,
        rating: rating,
        reviewCount: reviewCount,
      },
      questions: questions,
      cancellationPolicy: cancellationPolicy,
    },
  };
};

module.exports = {
  getAvailableAppointments,
  getAppointmentDetails,
  getAppointmentByShareLink,
};

