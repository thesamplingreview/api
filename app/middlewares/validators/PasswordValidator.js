const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { User, PasswordReset } = require('../../models');

/* eslint-disable newline-per-chained-call */
const emailValidator = () => body('email')
  .trim()
  .escape()
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'email'))
  .isEmail().bail()
  .withMessage(validatorMessage('validation.auth', 'Email'))
  .custom(async (val) => {
    const exist = await User.findOne({ where: { email: val } });
    if (!exist) {
      throw new Error('Not found');
    }
  }).bail()
  .withMessage(validatorMessage('validation.exist', 'Email'));

const tokenValidator = () => body('token')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Token'))
  .custom(async (val, { req }) => {
    const reset = await PasswordReset.findOne({ where: { token: val } });
    if (!reset) {
      throw new Error(req.__('validation.not_exist', { field: 'Token' }));
    }
    const expiry = reset.created_at.getTime() + (1 * 60 * 60 * 1000); // 1 hour
    if (expiry < (new Date()).getTime()) {
      throw new Error('Token expired.');
    }
    req.reset = reset;
    return true;
  }).bail();

const passwordValidator = () => body('password')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Password'))
  .isLength({ min: 6 }).bail()
  .withMessage(validatorMessage('validation.length_min', {
    field: 'Password',
    min: 6,
  }));

const newPasswordValidator = () => body('new_password')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'New Password'))
  .isLength({ min: 6 }).bail()
  .withMessage(validatorMessage('validation.length_min', {
    field: 'New Password',
    min: 6,
  }));

const oldPasswordValidator = () => body('old_password')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Old Password'));

/* eslint-enable newline-per-chained-call */

exports.resetTokenReq = [
  emailValidator(),
];

exports.changePasswordReq = [
  newPasswordValidator(),
  oldPasswordValidator(),
];

exports.resetPasswordReq = [
  emailValidator(),
  tokenValidator(),
  passwordValidator(),
];
