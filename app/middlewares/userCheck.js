const { AuthError } = require('../errors');
const AuthService = require('../services/AuthService');
const UserService = require('../services/UserService');

const userCheck = (role = '') => {
  return async (req, res, next) => {
    const userId = req.user.id;
    if (!userId) {
      next(new AuthError());
    }

    try {
      let userObj;
      // check for specified role group
      if (role) {
        const authService = new AuthService();
        const user = await authService.checkUserRoleGroup(userId, role);
        if (user) {
          userObj = {
            id: user.id,
            email: user.email,
            role_id: user.role_id,
            role_code: user.UserRole.code,
          };
        }
      } else {
        const userService = new UserService();
        const user = await userService.findById(userId);
        if (user) {
          userObj = {
            id: user.id,
            email: user.email,
          };
        }
      }
      if (!userObj) {
        throw new Error('Invalid user / role');
      }

      // update global variable
      req.user = userObj;

      // continue
      next();
    } catch (err) {
      // throw authError
      next(new AuthError(err.message));
    }
  };
};

module.exports = userCheck;
