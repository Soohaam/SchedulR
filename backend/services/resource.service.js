const { StatusCodes } = require('http-status-codes');
const { pool } = require('../config/db');
const AppError = require('../utils/appError');
const crypto = require('crypto');

/**
 * Create a new resource
 */
const createResource = async (organizerId, data) => {
  const { name, resourceType, description, location, capacity, imageUrl, workingHours } = data;

  if (!name) {
    throw new AppError('Resource name is required', StatusCodes.BAD_REQUEST);
  }

  // Ensure resourceType is valid or default to OTHER
  const validTypes = ['STAFF_MEMBER', 'ROOM', 'EQUIPMENT', 'VEHICLE', 'OTHER'];
  const typeToSave = validTypes.includes(resourceType) ? resourceType : 'OTHER';

  // Generate ID manually
  const newId = crypto.randomUUID();

  // Create resource
  const resourceResult = await pool.query(
    `INSERT INTO "Resource" 
      ("id", "name", "resourceType", "description", "location", "capacity", "imageUrl", "organizerId", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, NOW(), NOW())
     RETURNING *`,
    [
      newId,
      name,
      typeToSave,
      description || null,
      location || null,
      capacity || 1,
      imageUrl || null,
      organizerId
    ]
  );

  const resource = resourceResult.rows[0];

  // Create working hours if provided
  if (workingHours && workingHours.length > 0) {
    for (const wh of workingHours) {
      if (wh.isWorking) {
        await pool.query(
          `INSERT INTO "WorkingHours" 
            ("resourceId", "dayOfWeek", "isWorking", "startTime", "endTime", "breakStart", "breakEnd", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT ("resourceId", "dayOfWeek") DO UPDATE
           SET "isWorking" = EXCLUDED."isWorking",
               "startTime" = EXCLUDED."startTime",
               "endTime" = EXCLUDED."endTime",
               "breakStart" = EXCLUDED."breakStart",
               "breakEnd" = EXCLUDED."breakEnd",
               "updatedAt" = NOW()`,
          [resource.id, wh.dayOfWeek, wh.isWorking, wh.startTime || null, wh.endTime || null, wh.breakStart || null, wh.breakEnd || null]
        );
      }
    }
  }

  return {
    id: resource.id,
    name: resource.name,
    resourceType: resource.resourceType,
    description: resource.description,
    location: resource.location,
    capacity: resource.capacity,
    imageUrl: resource.imageUrl,
    isActive: resource.isActive,
    organizerId: resource.organizerId,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    workingHours: resource.workingHours || [], // Fixed property access to avoid undefined
  };
};

/**
 * List all resources for an organiser with filters and pagination
 */
const listResources = async (organizerId, filters) => {
  const { page = 1, limit = 10, search, isActive, resourceType } = filters;
  const offset = (page - 1) * limit;

  // Build query with filters
  let whereConditions = ['"organizerId" = $1'];
  let queryParams = [organizerId];
  let paramIndex = 2;

  if (search) {
    whereConditions.push(`("name" ILIKE $${paramIndex} OR "location" ILIKE $${paramIndex})`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  if (isActive !== undefined) {
    whereConditions.push(`"isActive" = $${paramIndex}`);
    queryParams.push(isActive === 'true');
    paramIndex++;
  }

  if (resourceType) {
    whereConditions.push(`"resourceType" = $${paramIndex}`);
    queryParams.push(resourceType);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM "Resource" WHERE ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  // Get paginated data
  const dataResult = await pool.query(
    `SELECT "id", "name", "resourceType", "description", "location", "capacity", "imageUrl", "isActive", "createdAt", "updatedAt"
     FROM "Resource"
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
 * Get single resource details with working hours and statistics
 */
const getResourceById = async (organizerId, resourceId) => {
  // Get resource
  const resourceResult = await pool.query(
    'SELECT * FROM "Resource" WHERE "id" = $1 AND "organizerId" = $2',
    [resourceId, organizerId]
  );

  if (resourceResult.rows.length === 0) {
    throw new AppError('Resource not found', StatusCodes.NOT_FOUND);
  }

  const resource = resourceResult.rows[0];

  // Get working hours
  const workingHoursResult = await pool.query(
    'SELECT "id", "dayOfWeek", "isWorking", "startTime", "endTime", "breakStart", "breakEnd" FROM "WorkingHours" WHERE "resourceId" = $1 ORDER BY "dayOfWeek"',
    [resourceId]
  );

  // Get availability exceptions
  const exceptionsResult = await pool.query(
    'SELECT "id", "date", "isAvailable", "startTime", "endTime", "reason" FROM "AvailabilityException" WHERE "resourceId" = $1 AND "date" >= CURRENT_DATE ORDER BY "date"',
    [resourceId]
  );

  // Get booking statistics
  const totalBookingsResult = await pool.query(
    'SELECT COUNT(*) FROM "Booking" WHERE "resourceId" = $1',
    [resourceId]
  );

  const upcomingBookingsResult = await pool.query(
    'SELECT COUNT(*) FROM "Booking" WHERE "resourceId" = $1 AND "startTime" >= NOW() AND "status" != $2',
    [resourceId, 'CANCELLED']
  );

  const completedBookingsResult = await pool.query(
    'SELECT COUNT(*) FROM "Booking" WHERE "resourceId" = $1 AND "status" = $2',
    [resourceId, 'COMPLETED']
  );

  return {
    id: resource.id,
    name: resource.name,
    resourceType: resource.resourceType,
    description: resource.description,
    location: resource.location,
    capacity: resource.capacity,
    imageUrl: resource.imageUrl,
    isActive: resource.isActive,
    organizerId: resource.organizerId,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    workingHours: workingHoursResult.rows,
    exceptions: exceptionsResult.rows,
    statistics: {
      totalBookings: parseInt(totalBookingsResult.rows[0].count),
      upcomingBookings: parseInt(upcomingBookingsResult.rows[0].count),
      completedBookings: parseInt(completedBookingsResult.rows[0].count),
    },
  };
};

/**
 * Update resource details
 */
const updateResource = async (organizerId, resourceId, data) => {
  // Verify resource belongs to organiser
  const existingResult = await pool.query(
    'SELECT * FROM "Resource" WHERE "id" = $1 AND "organizerId" = $2',
    [resourceId, organizerId]
  );

  if (existingResult.rows.length === 0) {
    throw new AppError('Resource not found', StatusCodes.NOT_FOUND);
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
    UPDATE "Resource"
    SET ${updateFields.join(', ')}
    WHERE "id" = $${paramIndex} AND "organizerId" = $${paramIndex + 1}
    RETURNING *
  `;

  const result = await pool.query(updateQuery, [...updateValues, resourceId, organizerId]);

  const resource = result.rows[0];

  return {
    id: resource.id,
    name: resource.name,
    resourceType: resource.resourceType,
    description: resource.description,
    location: resource.location,
    capacity: resource.capacity,
    imageUrl: resource.imageUrl,
    isActive: resource.isActive,
    organizerId: resource.organizerId,
    updatedAt: resource.updatedAt,
  };
};

/**
 * Soft delete resource
 */
const deleteResource = async (organizerId, resourceId) => {
  // Verify resource belongs to organiser
  const existingResult = await pool.query(
    'SELECT * FROM "Resource" WHERE "id" = $1 AND "organizerId" = $2',
    [resourceId, organizerId]
  );

  if (existingResult.rows.length === 0) {
    throw new AppError('Resource not found', StatusCodes.NOT_FOUND);
  }

  // Check for upcoming bookings
  const upcomingBookingsResult = await pool.query(
    'SELECT COUNT(*) FROM "Booking" WHERE "resourceId" = $1 AND "startTime" >= NOW() AND "status" IN ($2, $3)',
    [resourceId, 'PENDING', 'CONFIRMED']
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
       WHERE "resourceId" = $3 AND "startTime" >= NOW() AND "status" IN ($4, $5)`,
      ['CANCELLED', 'Resource deactivated', resourceId, 'PENDING', 'CONFIRMED']
    );
  }

  // Soft delete resource
  await pool.query(
    'UPDATE "Resource" SET "isActive" = FALSE, "updatedAt" = NOW() WHERE "id" = $1',
    [resourceId]
  );

  return {
    message: 'Resource deactivated successfully',
    upcomingBookingsCancelled: upcomingCount,
  };
};

/**
 * Update resource working hours
 */
const updateWorkingHours = async (organizerId, resourceId, workingHours) => {
  // Verify resource belongs to organiser
  const existingResult = await pool.query(
    'SELECT * FROM "Resource" WHERE "id" = $1 AND "organizerId" = $2',
    [resourceId, organizerId]
  );

  if (existingResult.rows.length === 0) {
    throw new AppError('Resource not found', StatusCodes.NOT_FOUND);
  }

  // Delete existing working hours
  await pool.query('DELETE FROM "WorkingHours" WHERE "resourceId" = $1', [resourceId]);

  // Insert new working hours
  for (const wh of workingHours) {
    await pool.query(
      `INSERT INTO "WorkingHours" 
        ("resourceId", "dayOfWeek", "isWorking", "startTime", "endTime", "breakStart", "breakEnd", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        resourceId,
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
    'SELECT "id", "dayOfWeek", "isWorking", "startTime", "endTime", "breakStart", "breakEnd" FROM "WorkingHours" WHERE "resourceId" = $1 ORDER BY "dayOfWeek"',
    [resourceId]
  );

  return {
    message: 'Working hours updated successfully',
    workingHours: updatedResult.rows,
  };
};

/**
 * Add availability exception for resource
 */
const addAvailabilityException = async (organizerId, resourceId, exceptionData) => {
  const { date, isAvailable, startTime, endTime, reason } = exceptionData;

  // Verify resource belongs to organiser
  const existingResult = await pool.query(
    'SELECT * FROM "Resource" WHERE "id" = $1 AND "organizerId" = $2',
    [resourceId, organizerId]
  );

  if (existingResult.rows.length === 0) {
    throw new AppError('Resource not found', StatusCodes.NOT_FOUND);
  }

  // Check if exception already exists for this date
  const existingExceptionResult = await pool.query(
    'SELECT * FROM "AvailabilityException" WHERE "resourceId" = $1 AND "date" = $2',
    [resourceId, date]
  );

  let exceptionId;

  if (existingExceptionResult.rows.length > 0) {
    // Update existing exception
    const updateResult = await pool.query(
      `UPDATE "AvailabilityException"
       SET "isAvailable" = $1, "startTime" = $2, "endTime" = $3, "reason" = $4, "updatedAt" = NOW()
       WHERE "resourceId" = $5 AND "date" = $6
       RETURNING "id"`,
      [isAvailable, startTime || null, endTime || null, reason || null, resourceId, date]
    );
    exceptionId = updateResult.rows[0].id;
  } else {
    // Create new exception
    const insertResult = await pool.query(
      `INSERT INTO "AvailabilityException"
        ("resourceId", "date", "isAvailable", "startTime", "endTime", "reason", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING "id"`,
      [resourceId, date, isAvailable, startTime || null, endTime || null, reason || null]
    );
    exceptionId = insertResult.rows[0].id;
  }

  // Check for existing bookings on this date
  const affectedBookingsResult = await pool.query(
    `SELECT COUNT(*) FROM "Booking"
     WHERE "resourceId" = $1 
     AND DATE("startTime") = $2 
     AND "status" IN ($3, $4)`,
    [resourceId, date, 'PENDING', 'CONFIRMED']
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
  createResource,
  listResources,
  getResourceById,
  updateResource,
  deleteResource,
  updateWorkingHours,
  addAvailabilityException,
};
