const { z } = require('zod');

/**
 * Validation schema for toggling user status
 */
const toggleUserStatusSchema = z.object({
    body: z.object({
        isActive: z.boolean({
            required_error: 'isActive is required',
            invalid_type_error: 'isActive must be a boolean value',
        }),
    }),
    params: z.object({
        id: z.string().uuid('Invalid user ID format'),
    }),
});

/**
 * Validation schema for changing user role
 */
const changeUserRoleSchema = z.object({
    body: z.object({
        newRole: z.enum(['CUSTOMER', 'ORGANISER', 'ADMIN'], {
            errorMap: () => ({ message: 'newRole must be one of: CUSTOMER, ORGANISER, ADMIN' }),
        }),
    }),
    params: z.object({
        id: z.string().uuid('Invalid user ID format'),
    }),
});

/**
 * Validation schema for getting users with filters
 */
const getUsersQuerySchema = z.object({
    query: z.object({
        role: z.enum(['CUSTOMER', 'ORGANISER', 'ADMIN']).optional(),
        isActive: z
            .string()
            .transform((val) => val === 'true')
            .pipe(z.boolean())
            .optional(),
        isVerified: z
            .string()
            .transform((val) => val === 'true')
            .pipe(z.boolean())
            .optional(),
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
            .default('10'),
    }),
});

/**
 * Validation schema for getting appointments with filters
 */
const getAppointmentsQuerySchema = z.object({
    query: z.object({
        status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
        organizerId: z.string().uuid('Invalid organiser ID format').optional(),
        customerId: z.string().uuid('Invalid customer ID format').optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
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
            .default('10'),
    }),
});

/**
 * Validation schema for getting user by ID
 */
const getUserByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid user ID format'),
    }),
});

module.exports = {
    toggleUserStatusSchema,
    changeUserRoleSchema,
    getUsersQuerySchema,
    getAppointmentsQuerySchema,
    getUserByIdSchema,
};
