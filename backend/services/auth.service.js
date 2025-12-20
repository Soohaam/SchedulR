const crypto = require('crypto');
const { StatusCodes } = require('http-status-codes');
const speakeasy = require('speakeasy');
const { pool } = require('../config/db');
const AppError = require('../utils/appError');
const { hashPassword, comparePassword } = require('../utils/password');
const { signAccessToken } = require('../utils/jwt');
const { sendEmail } = require('../utils/email');
const { toPublicUser } = require('../utils/user');

const TWO_FACTOR_SESSION_TTL_MINUTES = 5;
const TWO_FACTOR_SESSION_TTL_MS = TWO_FACTOR_SESSION_TTL_MINUTES * 60 * 1000;
const EMAIL_VERIFICATION_TTL_MINUTES = 15;
const OTP_WINDOW = 1;

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const generateAccessToken = (userId, role) => 
  signAccessToken({ 
    sub: userId, 
    userId: userId,
    role: role 
  });

const generateRandomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Register a new customer user
 */
const registerCustomer = async ({ email, password, fullName, phone }) => {
  const normalizedEmail = email.toLowerCase();

  const existingUserResult = await pool.query(
    'SELECT * FROM "User" WHERE "email" = $1',
    [normalizedEmail]
  );
  const existingUser = existingUserResult.rows[0];

  if (existingUser) {
    throw new AppError('Email is already registered', StatusCodes.CONFLICT);
  }

  const passwordHash = await hashPassword(password);
  const verificationCode = generateRandomCode();
  const verificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000);

  const userRecordResult = await pool.query(
    `INSERT INTO "User" (
      "id", "email", "password", "fullName", "phone", "role", 
      "timezone", "isActive", "isVerified", "isEmailVerified", 
      "emailVerificationToken", "emailVerificationExpires", 
      "emailNotifications", "smsNotifications", "loginCount",
      "createdAt", "updatedAt"
    )
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'UTC', TRUE, FALSE, FALSE, $6, $7, TRUE, FALSE, 0, NOW(), NOW())
    RETURNING *`,
    [normalizedEmail, passwordHash, fullName.trim(), phone || null, 'CUSTOMER', verificationCode, verificationExpires]
  );
  const userRecord = userRecordResult.rows[0];

  await sendEmail({
    to: normalizedEmail,
    subject: 'Verify your email - Customer Registration',
    text: `Your verification code is: ${verificationCode}`,
    html: `<p>Thank you for registering as a Customer!</p><p>Your verification code is: <strong>${verificationCode}</strong></p><p>This code will expire in ${EMAIL_VERIFICATION_TTL_MINUTES} minutes.</p>`,
  });

  return {
    message: 'Registration successful. Please verify your email.',
    requiresEmailVerification: true,
    email: normalizedEmail,
  };
};

/**
 * Register a new organiser user
 */
const registerOrganiser = async ({ email, password, fullName, phone }) => {
  const normalizedEmail = email.toLowerCase();

  const existingUserResult = await pool.query(
    'SELECT * FROM "User" WHERE "email" = $1',
    [normalizedEmail]
  );
  const existingUser = existingUserResult.rows[0];

  if (existingUser) {
    throw new AppError('Email is already registered', StatusCodes.CONFLICT);
  }

  const passwordHash = await hashPassword(password);
  const verificationCode = generateRandomCode();
  const verificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000);

  const userRecordResult = await pool.query(
    `INSERT INTO "User" (
      "id", "email", "password", "fullName", "phone", "role", 
      "timezone", "isActive", "isVerified", "isEmailVerified", 
      "emailVerificationToken", "emailVerificationExpires", 
      "emailNotifications", "smsNotifications", "loginCount",
      "createdAt", "updatedAt"
    )
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'UTC', TRUE, FALSE, FALSE, $6, $7, TRUE, FALSE, 0, NOW(), NOW())
    RETURNING *`,
    [normalizedEmail, passwordHash, fullName.trim(), phone || null, 'ORGANISER', verificationCode, verificationExpires]
  );
  const userRecord = userRecordResult.rows[0];

  await sendEmail({
    to: normalizedEmail,
    subject: 'Verify your email - Organiser Registration',
    text: `Your verification code is: ${verificationCode}`,
    html: `<p>Thank you for registering as an Organiser!</p><p>Your verification code is: <strong>${verificationCode}</strong></p><p>This code will expire in ${EMAIL_VERIFICATION_TTL_MINUTES} minutes.</p>`,
  });

  return {
    message: 'Registration successful. Please verify your email.',
    requiresEmailVerification: true,
    email: normalizedEmail,
  };
};

const verifyEmail = async ({ email, code }) => {
  const normalizedEmail = email.toLowerCase();

  const userResult = await pool.query(
    'SELECT * FROM "User" WHERE "email" = $1',
    [normalizedEmail]
  );
  const user = userResult.rows[0];

  if (!user) {
    throw new AppError('User not found', StatusCodes.NOT_FOUND);
  }

  if (user.isEmailVerified) {
    throw new AppError('Email is already verified', StatusCodes.BAD_REQUEST);
  }

  if (user.emailVerificationToken !== code) {
    throw new AppError('Invalid verification code', StatusCodes.BAD_REQUEST);
  }

  if (new Date(user.emailVerificationExpires).getTime() < Date.now()) {
    throw new AppError('Verification code expired', StatusCodes.BAD_REQUEST);
  }

  const updatedUserResult = await pool.query(
    `UPDATE "User"
     SET "isEmailVerified" = TRUE, "isVerified" = TRUE, 
         "emailVerificationToken" = NULL, "emailVerificationExpires" = NULL, 
         "updatedAt" = NOW()
     WHERE "id" = $1
     RETURNING *`,
    [user.id]
  );
  const updatedUser = updatedUserResult.rows[0];

  const accessToken = generateAccessToken(updatedUser.id, updatedUser.role);

  return {
    message: 'Email verified successfully',
    user: toPublicUser(updatedUser),
    accessToken,
  };
};

const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase();

  const userResult = await pool.query(
    'SELECT * FROM "User" WHERE "email" = $1',
    [normalizedEmail]
  );
  const user = userResult.rows[0];

  if (!user) {
    throw new AppError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  }

  // Check if user account is active
  if (!user.isActive) {
    throw new AppError(
      'Your account has been deactivated. Please contact support.',
      StatusCodes.FORBIDDEN
    );
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  }

  if (!user.isEmailVerified) {
    throw new AppError('Email not verified. Please verify your email first.', StatusCodes.FORBIDDEN);
  }

  // Update login tracking
  const updatedUserResult = await pool.query(
    `UPDATE "User" 
     SET "loginCount" = "loginCount" + 1, "lastLoginAt" = NOW(), "updatedAt" = NOW()
     WHERE "id" = $1
     RETURNING *`,
    [user.id]
  );
  const updatedUser = updatedUserResult.rows[0];

  const accessToken = generateAccessToken(updatedUser.id, updatedUser.role);

  return {
    message: 'Login successful',
    user: toPublicUser(updatedUser),
    accessToken,
  };
};

const verifyTwoFactorLogin = async ({ twoFactorToken, code }) => {
  const session = await validateTwoFactorSession(twoFactorToken);

  const userResult = await pool.query(
    'SELECT * FROM "User" WHERE "id" = $1',
    [session.userId]
  );
  const user = userResult.rows[0];

  if (!user || !user.twoFactorSecret) {
    throw new AppError(
      'Two-factor authentication is not enabled for this account',
      StatusCodes.BAD_REQUEST,
    );
  }

  const isValid = verifyOtpCode(user.twoFactorSecret, code);

  if (!isValid) {
    throw new AppError('Invalid verification code', StatusCodes.UNAUTHORIZED);
  }

  await pool.query('DELETE FROM "TwoFactorSession" WHERE "id" = $1', [session.id]);

  const accessToken = generateAccessToken(user.id);

  return {
    user: toPublicUser(user),
    accessToken,
  };
};

const generateTwoFactorSetup = async (userId) => {
  const userResult = await pool.query(
    'SELECT * FROM "User" WHERE "id" = $1',
    [userId]
  );
  const user = userResult.rows[0];

  if (!user) {
    throw new AppError('User not found', StatusCodes.NOT_FOUND);
  }

  const secret = speakeasy.generateSecret({
    length: 32,
    name: `${getOtpIssuer()} (${user.email})`,
  });

  await pool.query(
    'UPDATE "User" SET "twoFactorTempSecret" = $1, "updatedAt" = NOW() WHERE "id" = $2',
    [secret.base32, userId]
  );

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
  };
};

const enableTwoFactor = async (userId, code) => {
  const userResult = await pool.query(
    'SELECT * FROM "User" WHERE "id" = $1',
    [userId]
  );
  const user = userResult.rows[0];

  if (!user) {
    throw new AppError('User not found', StatusCodes.NOT_FOUND);
  }

  if (!user.twoFactorTempSecret) {
    throw new AppError(
      'Two-factor setup was not requested',
      StatusCodes.BAD_REQUEST,
    );
  }

  const isValid = verifyOtpCode(user.twoFactorTempSecret, code);

  if (!isValid) {
    throw new AppError('Invalid verification code', StatusCodes.UNAUTHORIZED);
  }

  const updatedUserResult = await pool.query(
    `UPDATE "User"
     SET "twoFactorSecret" = "twoFactorTempSecret", "twoFactorTempSecret" = NULL, "isTwoFactorEnabled" = TRUE, "updatedAt" = NOW()
     WHERE "id" = $1
     RETURNING *`,
    [userId]
  );
  const updatedUser = updatedUserResult.rows[0];

  return toPublicUser(updatedUser);
};

const disableTwoFactor = async (userId, code) => {
  const userResult = await pool.query(
    'SELECT * FROM "User" WHERE "id" = $1',
    [userId]
  );
  const user = userResult.rows[0];

  if (!user) {
    throw new AppError('User not found', StatusCodes.NOT_FOUND);
  }

  if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
    throw new AppError(
      'Two-factor authentication is not enabled',
      StatusCodes.BAD_REQUEST,
    );
  }

  const isValid = verifyOtpCode(user.twoFactorSecret, code);

  if (!isValid) {
    throw new AppError('Invalid verification code', StatusCodes.UNAUTHORIZED);
  }

  const updatedUserResult = await pool.query(
    `UPDATE "User"
     SET "twoFactorSecret" = NULL, "twoFactorTempSecret" = NULL, "isTwoFactorEnabled" = FALSE, "updatedAt" = NOW()
     WHERE "id" = $1
     RETURNING *`,
    [userId]
  );
  const updatedUser = updatedUserResult.rows[0];

  return toPublicUser(updatedUser);
};

const getProfile = async (userId) => {
  const userResult = await pool.query(
    'SELECT * FROM "User" WHERE "id" = $1',
    [userId]
  );
  const user = userResult.rows[0];

  if (!user) {
    throw new AppError('User not found', StatusCodes.NOT_FOUND);
  }

  return toPublicUser(user);
};

/**
 * Logout user
 * Note: Since we're using stateless JWT, logout is handled on the client side
 * by removing the token. This function can be used for logging purposes.
 */
const logout = async (userId) => {
  // For stateless JWT, logout is client-side
  // This endpoint can be used for audit logging if needed
  return {
    message: 'Logout successful',
  };
};

module.exports = {
  registerCustomer,
  registerOrganiser,
  verifyEmail,
  login,
  logout,
  getProfile,
};
