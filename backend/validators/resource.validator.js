const { z } = require('zod');

const timeSchema = z
  .string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format (e.g., 09:00)');

const workingHoursItemSchema = z.object({
  dayOfWeek: z
    .number()
    .int()
    .min(0, 'Day of week must be between 0 (Sunday) and 6 (Saturday)')
    .max(6, 'Day of week must be between 0 (Sunday) and 6 (Saturday)'),
  isWorking: z.boolean(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  breakStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  breakEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

// Resource types enum
const resourceTypeEnum = z.enum(['STAFF_MEMBER', 'ROOM', 'EQUIPMENT', 'VEHICLE', 'OTHER']);

// Create resource schema
const createResourceSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(200, 'Name too long'),
    resourceType: resourceTypeEnum,
    description: z.string().trim().max(2000, 'Description too long').optional(),
    location: z.string().trim().max(500, 'Location too long').optional(),
    capacity: z.number().int().min(1, 'Capacity must be at least 1').optional(),
    imageUrl: z.string().trim().url('Image URL must be a valid URL').optional(),
    workingHours: z.array(workingHoursItemSchema).optional(),
  }),
});

// Update resource schema
const updateResourceSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(200, 'Name too long').optional(),
    resourceType: resourceTypeEnum.optional(),
    description: z.string().trim().max(2000, 'Description too long').optional().nullable(),
    location: z.string().trim().max(500, 'Location too long').optional().nullable(),
    capacity: z.number().int().min(1, 'Capacity must be at least 1').optional().nullable(),
    imageUrl: z.string().trim().url('Image URL must be a valid URL').optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

// List resources query schema
const listResourcesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    search: z.string().trim().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    resourceType: resourceTypeEnum.optional(),
  }),
});

// Update working hours schema
const updateWorkingHoursSchema = z.object({
  body: z.object({
    workingHours: z.array(workingHoursItemSchema).min(1, 'At least one working hour entry is required'),
  }),
});

// Add availability exception schema
const addExceptionSchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    isAvailable: z.boolean(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    reason: z.string().trim().max(500, 'Reason too long').optional(),
  }),
});

module.exports = {
  createResourceSchema,
  updateResourceSchema,
  listResourcesSchema,
  updateWorkingHoursSchema,
  addExceptionSchema,
};
