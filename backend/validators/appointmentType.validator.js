const { z } = require('zod');
const crypto = require('crypto');

const appointmentResourceTypeEnum = z.enum(['USER', 'RESOURCE']);

const questionTypeEnum = z.enum([
  'SHORT_TEXT',
  'LONG_TEXT',
  'MULTIPLE_CHOICE',
  'CHECKBOXES',
  'DROPDOWN',
  'YES_NO',
  'DATE',
  'NUMBER'
]);

// Question schema for nested questions
const questionSchema = z.object({
  questionText: z.string().trim().min(1, 'Question text is required').max(500),
  questionType: questionTypeEnum,
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
});

// Cancellation policy schema
const cancellationPolicySchema = z.object({
  allowCancellation: z.boolean().default(true),
  cancellationDeadlineHours: z.number().int().min(0).default(24),
  refundPercentage: z.number().int().min(0).max(100).default(100),
  cancellationFee: z.number().min(0).optional(),
  noShowPolicy: z.string().trim().max(1000).optional(),
});

// Create appointment type schema
const createAppointmentTypeSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    description: z.string().trim().max(2000).optional(),
    duration: z.number().int().min(5, 'Duration must be at least 5 minutes').max(1440, 'Duration cannot exceed 24 hours'),
    type: appointmentResourceTypeEnum,
    location: z.string().trim().max(500).optional(),
    meetingUrl: z.string().trim().url('Meeting URL must be valid').optional(),
    introductoryMessage: z.string().trim().max(2000).optional(),
    color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code').default('#3B82F6'),
    maxBookingsPerSlot: z.number().int().min(1).default(1),
    manageCapacity: z.boolean().default(true),
    requiresPayment: z.boolean().default(false),
    price: z.number().min(0).optional(),
    manualConfirmation: z.boolean().default(false),
    autoAssignment: z.boolean().default(true),
    minAdvanceBookingMinutes: z.number().int().min(0).default(120),
    maxAdvanceBookingDays: z.number().int().min(1).default(30),
    bufferTimeMinutes: z.number().int().min(0).default(0),
    confirmationMessage: z.string().trim().max(2000).optional(),
    isPublished: z.boolean().default(false),
    questions: z.array(questionSchema).optional(),
    cancellationPolicy: cancellationPolicySchema.optional(),
  }).refine(data => {
    if (data.requiresPayment && (!data.price || data.price <= 0)) {
      return false;
    }
    return true;
  }, {
    message: 'Price is required when payment is enabled',
    path: ['price'],
  }),
});

// Update appointment type schema
const updateAppointmentTypeSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(200).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    duration: z.number().int().min(5).max(1440).optional(),
    type: appointmentResourceTypeEnum.optional(),
    location: z.string().trim().max(500).optional().nullable(),
    meetingUrl: z.string().trim().url('Meeting URL must be valid').optional().nullable(),
    introductoryMessage: z.string().trim().max(2000).optional().nullable(),
    color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    maxBookingsPerSlot: z.number().int().min(1).optional(),
    manageCapacity: z.boolean().optional(),
    requiresPayment: z.boolean().optional(),
    price: z.number().min(0).optional().nullable(),
    manualConfirmation: z.boolean().optional(),
    autoAssignment: z.boolean().optional(),
    minAdvanceBookingMinutes: z.number().int().min(0).optional(),
    maxAdvanceBookingDays: z.number().int().min(1).optional(),
    bufferTimeMinutes: z.number().int().min(0).optional(),
    confirmationMessage: z.string().trim().max(2000).optional().nullable(),
    isPublished: z.boolean().optional(),
  }),
});

// List appointment types query schema
const listAppointmentTypesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    search: z.string().trim().optional(),
    isPublished: z.enum(['true', 'false']).optional(),
    type: appointmentResourceTypeEnum.optional(),
  }),
});

// Add questions schema
const addQuestionsSchema = z.object({
  body: z.object({
    questions: z.array(questionSchema).min(1, 'At least one question is required'),
  }),
});

// Update cancellation policy schema
const updateCancellationPolicySchema = z.object({
  body: cancellationPolicySchema,
});

// Set cancellation policy schema (for POST endpoint)
const setCancellationPolicySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid appointment type ID'),
  }),
  body: cancellationPolicySchema,
});

module.exports = {
  createAppointmentTypeSchema,
  updateAppointmentTypeSchema,
  listAppointmentTypesSchema,
  addQuestionsSchema,
  updateCancellationPolicySchema,
  setCancellationPolicySchema,
};
