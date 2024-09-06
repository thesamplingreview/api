const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { User } = require('../../models');

/* eslint-disable newline-per-chained-call */
const uniqueEmailValidator = () => body('email')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Email'))
  .isEmail().bail()
  .withMessage(validatorMessage('validation.invalid_email', 'Email'))
  .custom(async (val) => {
    const exist = await User.findOne({ where: { email: val } });
    if (exist) {
      throw new Error('Exist');
    }
    return true;
  }).bail()
  .withMessage(validatorMessage('validation.exist', 'Email'));

const existEmailValidator = () => body('email')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Email'))
  .isEmail().bail()
  .withMessage(validatorMessage('validation.invalid_email', 'Email'))
  .custom(async (val) => {
    const exist = await User.findOne({ where: { email: val } });
    if (!exist) {
      throw new Error('Not exist');
    }
    return true;
  }).bail()
  .withMessage(validatorMessage('validation.auth', 'Email'));

const nameValidator = () => body('name')
  .trim()
  .escape()
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Name'))
  .isLength({ min: 3, max: 50 }).bail()
  .withMessage(validatorMessage('validation.length_between', {
    field: 'Name',
    min: 3,
    max: 50,
  }));

const contactValidator = () => body('contact')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Contact'));

/* eslint-disable newline-per-chained-call */

exports.loginWithPasswordReq = [
  existEmailValidator(),
  body('password')
    .notEmpty()
    .withMessage(validatorMessage('validation.required', 'Password')),
];

exports.signupWithPasswordReq = [
  uniqueEmailValidator(),
  nameValidator(),
  // contactValidator(),
  body('password')
    .notEmpty().bail()
    .withMessage(validatorMessage('validation.required', 'Password'))
    .isLength({ min: 6 }).bail()
    .withMessage(validatorMessage('validation.length_min', {
      field: 'Password',
      min: 6,
    })),
];

exports.loginWithGoogleReq = [
  existEmailValidator(),
  body('token')
    .notEmpty()
    .withMessage(validatorMessage('validation.required', 'Token')),
];

exports.signupWithGoogleReq = [
  uniqueEmailValidator(),
  nameValidator(),
  // contactValidator(),
  body('google_user_id')
    .notEmpty()
    .withMessage(validatorMessage('validation.required', 'Google User ID')),
  body('token')
    .notEmpty()
    .withMessage(validatorMessage('validation.required', 'Token')),
];

exports.continueWithGoogleReq = [
  body('email')
    .notEmpty()
    .withMessage(validatorMessage('validation.required', 'Email')),
  body('token')
    .notEmpty()
    .withMessage(validatorMessage('validation.required', 'Token')),
];

exports.tokenRefreshReq = [
  body('refresh_token')
    .trim()
    .notEmpty()
    .withMessage(validatorMessage('validation.required')),
];

exports.requestSMSOtpReq = [
  contactValidator(),
];

exports.requestWAOtpReq = [
  contactValidator(),
];
