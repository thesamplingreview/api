const express = require('express');
const tokenInfoMiddleware = require('../../app/middlewares/tokenInfo');
const {
  AuthValidator,
  PasswordValidator,
} = require('../../app/middlewares/validators');
const {
  AuthController,
  MyController,
  PasswordController,
} = require('../../app/controllers/auth');

const router = express.Router();

// auth module
router.post('/login', AuthValidator.loginWithPasswordReq, AuthController.login);
router.post('/signup', AuthValidator.signupWithPasswordReq, AuthController.signup);
router.post('/token-refresh', AuthValidator.tokenRefreshReq, AuthController.tokenRefresh);
router.get('/validate', tokenInfoMiddleware(), AuthController.validate);
router.post('/invalidate', tokenInfoMiddleware(), AuthController.invalidate);

// my module
router.get('/my', tokenInfoMiddleware(), MyController.my);
router.put('/my', tokenInfoMiddleware(), MyController.update);

// password reset
router.post('/password/reset-token', PasswordValidator.resetTokenReq, PasswordController.resetToken);
router.post('/password/reset', PasswordValidator.resetPasswordReq, PasswordController.resetPassword);

module.exports = router;
