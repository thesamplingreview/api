const express = require('express');
const tokenInfoMiddleware = require('../../app/middlewares/tokenInfo');
const { AuthValidator } = require('../../app/middlewares/validators');
const AuthController = require('../../app/controllers/AuthController');
const MyController = require('../../app/controllers/MyController');

const router = express.Router();

// auth module
const authController = new AuthController();

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

// my module
const myController = new MyController();
router.get(
  '/my',
  tokenInfoMiddleware(),
  myController.my.bind(myController),
);

router.put(
  '/my',
  tokenInfoMiddleware(),
  myController.update.bind(myController),
);

module.exports = router;
