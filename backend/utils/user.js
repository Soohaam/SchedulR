const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  phone: user.phone,
  profileImage: user.profileImage,
  timezone: user.timezone,
  role: user.role,
  isActive: user.isActive,
  isVerified: user.isVerified,
  isEmailVerified: user.isEmailVerified,
  lastLoginAt: user.lastLoginAt,
  loginCount: user.loginCount,
  emailNotifications: user.emailNotifications,
  smsNotifications: user.smsNotifications,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

module.exports = {
  toPublicUser,
};
