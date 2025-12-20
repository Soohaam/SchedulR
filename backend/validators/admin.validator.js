const Joi = require('joi');

/**
 * Validation schema for toggling user status
 */
const toggleUserStatusSchema = Joi.object({
    body: Joi.object({
        isActive: Joi.boolean().required().messages({
            'boolean.base': 'isActive must be a boolean value',
            'any.required': 'isActive is required',
        }),
    }),
    params: Joi.object({
        id: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid user ID format',
            'any.required': 'User ID is required',
        }),
    }),
});

/**
 * Validation schema for changing user role
 */
const changeUserRoleSchema = Joi.object({
    body: Joi.object({
        newRole: Joi.string()
            .valid('CUSTOMER', 'ORGANISER', 'ADMIN')
            .required()
            .messages({
                'any.only': 'newRole must be one of: CUSTOMER, ORGANISER, ADMIN',
                'any.required': 'newRole is required',
            }),
    }),
    params: Joi.object({
        id: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid user ID format',
            'any.required': 'User ID is required',
        }),
    }),
});

/**
 * Validation schema for getting users with filters
 */
const getUsersQuerySchema = Joi.object({
    query: Joi.object({
        role: Joi.string().valid('CUSTOMER', 'ORGANISER', 'ADMIN').optional(),
        isActive: Joi.boolean().optional(),
        isVerified: Joi.boolean().optional(),
        search: Joi.string().trim().optional(),
        page: Joi.number().integer().min(1).default(1).optional(),
        limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    }),
});

/**
 * Validation schema for getting appointments with filters
 */
const getAppointmentsQuerySchema = Joi.object({
    query: Joi.object({
        status: Joi.string()
            .valid('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')
            .optional(),
        organizerId: Joi.string().uuid().optional(),
        customerId: Joi.string().uuid().optional(),
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date().iso().optional(),
        page: Joi.number().integer().min(1).default(1).optional(),
        limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    }),
});

/**
 * Validation schema for getting user by ID
 */
const getUserByIdSchema = Joi.object({
    params: Joi.object({
        id: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid user ID format',
            'any.required': 'User ID is required',
        }),
    }),
});

module.exports = {
    toggleUserStatusSchema,
    changeUserRoleSchema,
    getUsersQuerySchema,
    getAppointmentsQuerySchema,
    getUserByIdSchema,
};
