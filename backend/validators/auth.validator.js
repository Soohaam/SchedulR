const { z } = require('zod');

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Email must be valid')
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(64, 'Password must be at most 64 characters long')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
  .regex(/[a-z]/, 'Password must include at least one lowercase letter')
  .regex(/[0-9]/, 'Password must include at least one number');

const fullNameSchema = z
  .string()
  .trim()
  .min(1, 'Full name is required')
  .max(100, 'Full name must be at most 100 characters long');

const phoneSchema = z
  .string()
  .trim()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must be at most 15 digits')
  .regex(/^\+?[0-9]+$/, 'Phone number must contain only digits and optional + prefix')
  .optional();

// Customer registration schema
const registerCustomerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    fullName: fullNameSchema,
    phone: phoneSchema,
  }),
});

// Organiser registration schema
const registerOrganiserSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    fullName: fullNameSchema,
    phone: phoneSchema,
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  }),
});

const twoFactorVerifySchema = z.object({
  body: z.object({
    twoFactorToken: z.string().min(10, 'Invalid token'),
    code: z
      .string()
      .regex(/^\d{6}$/, 'Code must be a 6 digit number'),
  }),
});

const twoFactorCodeSchema = z.object({
  body: z.object({
    code: z
      .string()
      .regex(/^\d{6}$/, 'Code must be a 6 digit number'),
  }),
});

const emailVerificationSchema = z.object({
  body: z.object({
    email: emailSchema,
    code: z
      .string()
      .regex(/^\d{6}$/, 'Code must be a 6 digit number'),
  }),
});

module.exports = {
  registerCustomerSchema,
  registerOrganiserSchema,
  loginSchema,
  twoFactorVerifySchema,
  twoFactorCodeSchema,
  emailVerificationSchema,
};
