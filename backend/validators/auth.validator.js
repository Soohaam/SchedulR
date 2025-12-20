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

const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().trim().max(50).optional(),
    lastName: z.string().trim().max(50).optional(),
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

module.exports = {
  registerSchema,
  loginSchema,
  twoFactorVerifySchema,
  twoFactorCodeSchema,
};
