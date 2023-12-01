const express = require('express');
const tokenInfoMiddleware = require('../../app/middlewares/tokenInfo');
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
  tokenInfoMiddleware(),
  authController.validate.bind(authController),
);

router.post(
  '/invalidate',
  tokenInfoMiddleware(),
  authController.invalidate.bind(authController),
);

router.get(
  '/my',
  tokenInfoMiddleware(),
  authController.my.bind(authController),
);

module.exports = router;
