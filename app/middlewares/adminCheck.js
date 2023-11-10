const { AuthError } = require('../errors');
const AuthService = require('../services/AuthService');
const { UserRole } = require('../models');

const adminCheck = async (req, res, next) => {
  const userId = req.user.id;
  if (!userId) {
    next(new AuthError());
  }

  try {
    const authService = new AuthService();
    const user = await authService.checkUserRoleGroup(userId, UserRole.GROUPS.ADMIN);
    if (!user) {
      throw new Error('Invalid role');
    }

    // update global variable
    req.user = {
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      role_code: user.UserRole.code,
    };

    // continue
    next();
  } catch (err) {
    // throw authError
    next(new AuthError(err.message));
  }
};

module.exports = adminCheck;
