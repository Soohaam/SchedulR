const { pool } = require('../config/db');
const AppError = require('../utils/appError');
const { StatusCodes } = require('http-status-codes');

/**
 * Helper to generate time slots
 */
const generateTimeSlots = (startStr, endStr, durationMinutes, dateStr) => {
  const slots = [];
  // Parse "HH:mm" to Date objects for the specific date
  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);

  let current = new Date(dateStr);
  current.setHours(startH, startM, 0, 0);

  const end = new Date(dateStr);
  end.setHours(endH, endM, 0, 0);

  while (current.getTime() + durationMinutes * 60000 <= end.getTime()) {
    const slotEnd = new Date(current.getTime() + durationMinutes * 60000);
    slots.push({
      startTime: current.toISOString(),
      endTime: slotEnd.toISOString(),
      available: true // Default, will be checked against bookings later
    });
    current = slotEnd;
  }

  return slots;
};

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

  if (search) {
    conditions.push(`(at.title ILIKE $${paramIndex} OR at.description ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

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

  if (duration !== undefined && duration !== null) {
    conditions.push(`at.duration = $${paramIndex}`);
    params.push(duration);
    paramIndex++;
  }

  if (type) {
    conditions.push(`at.type = $${paramIndex}`);
    params.push(type);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) as total
    FROM "AppointmentType" at
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

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
  const appointmentQuery = `
    SELECT 
      at.*,
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

  const questionsQuery = `
    SELECT "id", "questionText", "questionType", "options", "isRequired", "order" FROM "Question"
    WHERE "appointmentTypeId" = $1
    ORDER BY "order" ASC
  `;
  const questionsResult = await pool.query(questionsQuery, [appointmentId]);

  // Parse options JSON for each question
  const questions = questionsResult.rows.map(q => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : null
  }));

  const policyQuery = `SELECT * FROM "CancellationPolicy" WHERE "appointmentTypeId" = $1`;
  const policyResult = await pool.query(policyQuery, [appointmentId]);
  const cancellationPolicy = policyResult.rows[0] ? {
    ...policyResult.rows[0],
    cancellationFee: policyResult.rows[0].cancellationFee ? parseFloat(policyResult.rows[0].cancellationFee) : null
  } : null;

  const { rating, reviewCount } = await calculateOrganizerRating(appointment.organizerId);

  return {
    success: true,
    appointmentType: {
      ...appointment,
      price: appointment.price ? parseFloat(appointment.price) : null,
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
 * Get appointment type by share link
 */
const getAppointmentByShareLink = async (shareLink) => {
  const appointmentQuery = `
    SELECT 
      at.*,
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

  const questionsQuery = `
    SELECT "id", "questionText", "questionType", "options", "isRequired", "order" FROM "Question"
    WHERE "appointmentTypeId" = $1
    ORDER BY "order" ASC
  `;
  const questionsResult = await pool.query(questionsQuery, [appointment.id]);

  // Parse options JSON for each question
  const questions = questionsResult.rows.map(q => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : null
  }));

  const policyQuery = `SELECT * FROM "CancellationPolicy" WHERE "appointmentTypeId" = $1`;
  const policyResult = await pool.query(policyQuery, [appointment.id]);
  const cancellationPolicy = policyResult.rows[0] ? {
    ...policyResult.rows[0],
    cancellationFee: policyResult.rows[0].cancellationFee ? parseFloat(policyResult.rows[0].cancellationFee) : null
  } : null;

  const { rating, reviewCount } = await calculateOrganizerRating(appointment.organizerId);

  return {
    success: true,
    appointmentType: {
      ...appointment,
      price: appointment.price ? parseFloat(appointment.price) : null,
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
 * Get available providers and their slots
 */
const getAvailableProviders = async (appointmentId, date) => {
  if (!date) {
    throw new AppError('Date is required', StatusCodes.BAD_REQUEST);
  }

  // 1. Get Appointment Type
  const aptResult = await pool.query('SELECT * FROM "AppointmentType" WHERE id = $1', [appointmentId]);
  if (aptResult.rows.length === 0) {
    throw new AppError('Appointment Type not found', StatusCodes.NOT_FOUND);
  }
  const appointment = aptResult.rows[0];
  const isResourceParams = appointment.type === 'RESOURCE';

  // 2. Fetch Providers (Staff or Resources)
  let providers = [];
  if (isResourceParams) {
    const resQuery = `
      SELECT r.id, r.name, r.description, r."imageUrl" as "profileImage", 'RESOURCE' as type
      FROM "Resource" r 
      WHERE r."organizerId" = $1 AND r."isActive" = TRUE
    `;
    // Note: Ideally we should link resources to AppointmentTypes specifically, but for now assumption is all organizer resources?
    // OR we might need a many-to-many relation table not shown in schema?
    // Looking at schema, AppointmentType doesn't directly link to specific Staff/Resource. 
    // It's usually dynamic or the organizer's pool. 
    // Wait, BookingSlot has staffMemberId.
    // Let's assume for now we fetch ALL active staff/resources of the organizer
    // UNLESS there's a specific logic.
    // Update: Usually AppointmentType might be linked to specific staff.
    // For this implementation, I will fetch all belonging to the organizer.

    providers = (await pool.query(resQuery, [appointment.organizerId])).rows;
  } else {
    // Staff
    const staffQuery = `
      SELECT s.id, s.name, s.title, s.specialization, s."profileImage", 'STAFF' as type
      FROM "StaffMember" s
      WHERE s."organizerId" = $1 AND s."isActive" = TRUE
    `;
    providers = (await pool.query(staffQuery, [appointment.organizerId])).rows;
  }

  // 3. For each provider, calculate slots
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay(); // 0-6

  const resultProviders = await Promise.all(providers.map(async (provider) => {
    // a. Get Working Hours from AppointmentType (not from individual staff/resource)
    const whQuery = `
      SELECT * FROM "WorkingHours"
      WHERE "appointmentTypeId" = $1
      AND "dayOfWeek" = $2 AND "isWorking" = TRUE
    `;
    const whResult = await pool.query(whQuery, [appointmentId, dayOfWeek]);

    if (whResult.rows.length === 0) {
      return { ...provider, availableSlots: [], totalAvailableSlots: 0 };
    }

    // b. Check Exceptions for the AppointmentType
    const exQuery = `
      SELECT * FROM "AvailabilityException"
      WHERE "appointmentTypeId" = $1
      AND date = $2::date
    `;
    const exResult = await pool.query(exQuery, [appointmentId, date]);
    let workHours = whResult.rows[0];

    // If exception says not available
    if (exResult.rows.length > 0 && !exResult.rows[0].isAvailable) {
      return { ...provider, availableSlots: [], totalAvailableSlots: 0 };
    }
    // If exception provides custom hours
    if (exResult.rows.length > 0 && exResult.rows[0].isAvailable && exResult.rows[0].startTime) {
      workHours = {
        ...workHours,
        startTime: exResult.rows[0].startTime,
        endTime: exResult.rows[0].endTime
      };
    }

    // c. Generate raw slots
    let slots = generateTimeSlots(workHours.startTime, workHours.endTime, appointment.duration, date);

    // d. Check existing bookings
    // We need to check if any booking overlaps with these slots
    const bookingsQuery = `
      SELECT "startTime", "endTime" 
      FROM "Booking"
      WHERE ${isResourceParams ? '"resourceId"' : '"staffMemberId"'} = $1
      AND date = $2::date
      AND status != 'CANCELLED'
    `;
    const bookingsResult = await pool.query(bookingsQuery, [provider.id, date]);
    const existingBookings = bookingsResult.rows.map(b => ({
      start: new Date(b.startTime).getTime(),
      end: new Date(b.endTime).getTime()
    }));

    // Mark unavailable
    slots = slots.map(slot => {
      const slotStart = new Date(slot.startTime).getTime();
      const slotEnd = new Date(slot.endTime).getTime();

      const isBooked = existingBookings.some(booking => {
        // Overlap logic: (StartA < EndB) and (EndA > StartB)
        return (slotStart < booking.end) && (slotEnd > booking.start);
      });

      return { ...slot, available: !isBooked };
    });

    return {
      ...provider,
      availableSlots: slots,
      totalAvailableSlots: slots.filter(s => s.available).length
    };
  }));

  return {
    success: true,
    date,
    providers: resultProviders
  };
};

/**
 * Check availability for a specific slot
 */
const checkAvailability = async ({
  appointmentId,
  providerId,
  providerType,
  date,
  startTime,
  capacity = 1
}) => {
  // 1. Basic validation
  const aptResult = await pool.query('SELECT * FROM "AppointmentType" WHERE id = $1', [appointmentId]);
  if (aptResult.rows.length === 0) throw new AppError('Appointment not found', StatusCodes.NOT_FOUND);
  const appointment = aptResult.rows[0];

  const duration = appointment.duration;
  const start = new Date(startTime);
  const end = new Date(start.getTime() + duration * 60000);

  // 2. Check AppointmentType Working Hours (not provider-specific working hours)
  const dayOfWeek = start.getDay();
  const timeStr = start.toTimeString().slice(0, 5); // HH:mm

  // Check working hours from AppointmentType
  const whQuery = `
    SELECT * FROM "WorkingHours"
    WHERE "appointmentTypeId" = $1 AND "dayOfWeek" = $2 AND "isWorking" = TRUE
    AND "startTime" <= $3 AND "endTime" >= $4
  `;
  // Note: Simple string comparison works for HH:mm usually, but crossing midnight needs care. 
  // Assuming standard day hours.
  // We need to verify end time matches too.
  const endTimeStr = end.toTimeString().slice(0, 5);

  const whResult = await pool.query(whQuery, [appointmentId, dayOfWeek, timeStr, endTimeStr]);

  // Also check exceptions for AppointmentType
  const exQuery = `
    SELECT * FROM "AvailabilityException"
    WHERE "appointmentTypeId" = $1 AND date = $2::date
  `;
  const exResult = await pool.query(exQuery, [appointmentId, date]);
  
  if (exResult.rows.length > 0 && !exResult.rows[0].isAvailable) {
    return { success: true, available: false, reason: "Not available on this date" };
  }

  if (whResult.rows.length === 0) {
    return { success: true, available: false, reason: "Outside working hours" };
  }

  // Determine ID column for booking checks
  const idCol = providerType === 'RESOURCE' ? '"resourceId"' : '"staffMemberId"';

  // 3. Check Bookings overlap
  const bookingQuery = `
    SELECT COUNT(*) as count 
    FROM "Booking"
    WHERE ${idCol} = $1
    AND status != 'CANCELLED'
    AND "startTime" < $3 AND "endTime" > $2
  `;
  const bookingResult = await pool.query(bookingQuery, [providerId, start.toISOString(), end.toISOString()]);
  const currentBookings = parseInt(bookingResult.rows[0].count);

  const maxCapacity = appointment.maxBookingsPerSlot || 1;
  const remainingd = maxCapacity - currentBookings;

  if (remainingd < capacity) {
    return { success: true, available: false, reason: "Fully booked" };
  }

  return {
    success: true,
    available: true,
    slot: {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      remainingCapacity: remainingd,
      price: appointment.price ? parseFloat(appointment.price) : 0
    }
  };
};

module.exports = {
  getAvailableAppointments,
  getAppointmentDetails,
  getAppointmentByShareLink,
  getAvailableProviders,
  checkAvailability
};
