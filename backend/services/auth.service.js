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

const generateAccessToken = (userId) => signAccessToken({ sub: userId });

const generateRandomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sanitizeOptionalString = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const createTwoFactorSession = async (userId) => {
  await pool.query('DELETE FROM "TwoFactorSession" WHERE "userId" = $1', [userId]);

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TWO_FACTOR_SESSION_TTL_MS);

  await pool.query(
    'INSERT INTO "TwoFactorSession" ("userId", "tokenHash", "expiresAt") VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );

  return token;
};

const validateTwoFactorSession = async (token) => {
  const tokenHash = hashToken(token);

  const result = await pool.query(
    'SELECT * FROM "TwoFactorSession" WHERE "tokenHash" = $1',
    [tokenHash]
  );
  const session = result.rows[0];

  if (!session) {
    throw new AppError(
      'Invalid two-factor session',
      StatusCodes.UNAUTHORIZED,
    );
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await pool.query('DELETE FROM "TwoFactorSession" WHERE "id" = $1', [session.id]);
    throw new AppError('Two-factor session expired', StatusCodes.UNAUTHORIZED);
  }

  return session;
};

const verifyOtpCode = (secret, code) =>
  speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code,
    window: OTP_WINDOW,
  });

const getOtpIssuer = () => process.env.APP_NAME || 'Odoo Final API';

const register = async ({ email, password, firstName, lastName }) => {
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
    `INSERT INTO "User" ("email", "passwordHash", "firstName", "lastName", "isEmailVerified", "emailVerificationToken", "emailVerificationExpires", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, FALSE, $5, $6, NOW(), NOW())
     RETURNING *`,
    [normalizedEmail, passwordHash, sanitizeOptionalString(firstName), sanitizeOptionalString(lastName), verificationCode, verificationExpires]
  );
  const userRecord = userRecordResult.rows[0];

  await sendEmail({
    to: normalizedEmail,
    subject: 'Verify your email',
    text: `Your verification code is: ${verificationCode}`,
    html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>`,
  });

  return {
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
     SET "isEmailVerified" = TRUE, "emailVerificationToken" = NULL, "emailVerificationExpires" = NULL, "updatedAt" = NOW()
     WHERE "id" = $1
     RETURNING *`,
    [user.id]
  );
  const updatedUser = updatedUserResult.rows[0];

  const accessToken = generateAccessToken(updatedUser.id);

  return {
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

  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  }

  if (!user.isEmailVerified) {
    throw new AppError('Email not verified. Please verify your email first.', StatusCodes.FORBIDDEN);
  }

  if (user.isTwoFactorEnabled && user.twoFactorSecret) {
    const twoFactorToken = await createTwoFactorSession(user.id);

    return {
      requiresTwoFactor: true,
      twoFactorToken,
      expiresIn: Math.floor(TWO_FACTOR_SESSION_TTL_MS / 1000),
    };
  }

  const accessToken = generateAccessToken(user.id);

  return {
    user: toPublicUser(user),
    accessToken,
    requiresTwoFactor: false,
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

module.exports = {
  register,
  login,
  verifyTwoFactorLogin,
  verifyEmail,
  generateTwoFactorSetup,
  enableTwoFactor,
  disableTwoFactor,
  getProfile,
};
