const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateCredentials, createToken } = require('../services/authService');
const activityService = require('../services/activityService');

const login = asyncHandler(async (req, res) => {
  const email = req.body?.email;
  const password = req.body?.password;

  if (!email || !password) {
    throw new AppError(400, 'Email and password are required');
  }

  const user = await authenticateCredentials(email, password);
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  if (user.isActive === false) {
    throw new AppError(403, 'This account is inactive');
  }

  await activityService.record({
    actorId: user._id,
    action: 'AUTH_LOGIN',
    entityType: 'User',
    entityId: user._id,
    description: `${user.name} signed in.`,
  });

  res.json({
    success: true,
    data: {
      token: createToken(user),
      user: user.toSafeObject(),
    },
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.toSafeObject(),
    },
  });
});

module.exports = { login, me };
