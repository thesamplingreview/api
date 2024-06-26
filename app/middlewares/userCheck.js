const { ForbiddenError } = require('../errors');
const AuthService = require('../services/AuthService');
const UserService = require('../services/UserService');
const { UserRole } = require('../models');

const userCheck = (role = '') => {
  return async (req, res, next) => {
    const userId = req.user.id;
    if (!userId) {
      next(new ForbiddenError());
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
            name: user.name,
            email: user.email,
            role_id: user.role_id,
            role_code: user.UserRole.code,
            role_group: user.UserRole.group,
            vendor_id: user.vendor_id,
          };
        }
      } else {
        const userService = new UserService();
        const user = await userService.findById(userId);
        if (user) {
          userObj = {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        }
      }
      if (!userObj) {
        throw new Error('Invalid user / role');
      }
      // reject if user role is vendor but don't have vendor_id
      if (userObj.role_group === UserRole.GROUPS.VENDOR && !userObj.vendor_id) {
        throw new Error('Invalid user role configuration');
      }

      // update global variable
      req.user = userObj;

      // continue
      next();
    } catch (err) {
      // throw authError
      next(new ForbiddenError(err.message));
    }
  };
};

module.exports = userCheck;
