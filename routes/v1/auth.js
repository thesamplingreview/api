const express = require('express');
const AuthMiddleware = require('../../app/middlewares/auth');
const { AuthValidator } = require('../../app/middlewares/validators');
const AuthController = require('../../app/controllers/AuthController');

const router = express.Router();

const authController = new AuthController();

// auth module
router.post(
  '/login',
  AuthValidator.loginWithPasswordReq,
  authController.login.bind(authController),
);

router.post(
  '/token-refresh',
  AuthValidator.tokenRefreshReq,
  authController.tokenRefresh.bind(authController),
);

router.get(
  '/validate',
  [AuthMiddleware],
  authController.validate.bind(authController),
);

router.post(
  '/invalidate',
  [AuthMiddleware],
  authController.invalidate.bind(authController),
);

router.get(
  '/my',
  [AuthMiddleware],
  authController.my.bind(authController),
);

module.exports = router;
