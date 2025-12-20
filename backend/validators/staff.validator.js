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

// Create staff member schema
const createStaffMemberSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(200, 'Name too long'),
    email: z.string().trim().email('Email must be valid').toLowerCase(),
    phone: z
      .string()
      .trim()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number must be at most 15 digits')
      .regex(/^\+?[0-9]+$/, 'Phone number must contain only digits and optional + prefix')
      .optional(),
    title: z.string().trim().max(50, 'Title too long').optional(),
    specialization: z.string().trim().max(200, 'Specialization too long').optional(),
    description: z.string().trim().max(2000, 'Description too long').optional(),
    profileImage: z.string().trim().url('Profile image must be a valid URL').optional(),
    workingHours: z.array(workingHoursItemSchema).optional(),
  }),
});

// Update staff member schema
const updateStaffMemberSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(200, 'Name too long').optional(),
    email: z.string().trim().email('Email must be valid').toLowerCase().optional(),
    phone: z
      .string()
      .trim()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number must be at most 15 digits')
      .regex(/^\+?[0-9]+$/, 'Phone number must contain only digits and optional + prefix')
      .optional()
      .nullable(),
    title: z.string().trim().max(50, 'Title too long').optional().nullable(),
    specialization: z.string().trim().max(200, 'Specialization too long').optional().nullable(),
    description: z.string().trim().max(2000, 'Description too long').optional().nullable(),
    profileImage: z.string().trim().url('Profile image must be a valid URL').optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

// List staff members query schema
const listStaffMembersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    search: z.string().trim().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    specialization: z.string().trim().optional(),
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
  createStaffMemberSchema,
  updateStaffMemberSchema,
  listStaffMembersSchema,
  updateWorkingHoursSchema,
  addExceptionSchema,
};
