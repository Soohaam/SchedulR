const { z } = require('zod');

/**
 * Validation schema for getting bookings with filters
 */
const getBookingsQuerySchema = z.object({
    query: z.object({
        status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
        appointmentTypeId: z.string().uuid('Invalid appointment type ID').optional(),
        staffMemberId: z.string().uuid('Invalid staff member ID').optional(),
        resourceId: z.string().uuid('Invalid resource ID').optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        search: z.string().trim().optional(),
        page: z
            .string()
            .transform((val) => parseInt(val, 10))
            .pipe(z.number().int().min(1))
            .optional()
            .default('1'),
        limit: z
            .string()
            .transform((val) => parseInt(val, 10))
            .pipe(z.number().int().min(1).max(100))
            .optional()
            .default('20'),
    }),
});

/**
 * Validation schema for calendar query
 */
const getCalendarQuerySchema = z.object({
    query: z.object({
        month: z
            .string()
            .regex(/^\d{4}-\d{2}$/, 'Month must be in format YYYY-MM')
            .refine((val) => {
                const [year, month] = val.split('-').map(Number);
                return month >= 1 && month <= 12;
            }, 'Invalid month'),
        staffMemberId: z.string().uuid('Invalid staff member ID').optional(),
        resourceId: z.string().uuid('Invalid resource ID').optional(),
    }),
});

/**
 * Validation schema for confirming booking
 */
const confirmBookingSchema = z.object({
    body: z.object({
        confirmationMessage: z
            .string()
            .trim()
            .min(1, 'Confirmation message is required')
            .max(500, 'Confirmation message must be at most 500 characters')
            .optional(),
    }),
    params: z.object({
        id: z.string().uuid('Invalid booking ID'),
    }),
});

/**
 * Validation schema for rejecting booking
 */
const rejectBookingSchema = z.object({
    body: z.object({
        reason: z
            .string()
            .trim()
            .min(1, 'Rejection reason is required')
            .max(500, 'Rejection reason must be at most 500 characters'),
    }),
    params: z.object({
        id: z.string().uuid('Invalid booking ID'),
    }),
});

/**
 * Validation schema for cancelling booking
 */
const cancelBookingSchema = z.object({
    body: z.object({
        reason: z
            .string()
            .trim()
            .min(1, 'Cancellation reason is required')
            .max(500, 'Cancellation reason must be at most 500 characters'),
    }),
    params: z.object({
        id: z.string().uuid('Invalid booking ID'),
    }),
});

/**
 * Validation schema for rescheduling booking
 */
const rescheduleBookingSchema = z.object({
    body: z.object({
        newStartTime: z.string().datetime('Invalid date/time format'),
        reason: z
            .string()
            .trim()
            .max(500, 'Reason must be at most 500 characters')
            .optional(),
    }),
    params: z.object({
        id: z.string().uuid('Invalid booking ID'),
    }),
});

/**
 * Validation schema for booking ID parameter
 */
const bookingIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid booking ID'),
    }),
});

module.exports = {
    getBookingsQuerySchema,
    getCalendarQuerySchema,
    confirmBookingSchema,
    rejectBookingSchema,
    cancelBookingSchema,
    rescheduleBookingSchema,
    bookingIdParamSchema,
};
