const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  isTwoFactorEnabled: user.isTwoFactorEnabled,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

module.exports = {
  toPublicUser,
};
