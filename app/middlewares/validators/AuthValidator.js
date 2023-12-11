const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { User } = require('../../models');

/* eslint-disable newline-per-chained-call */
exports.loginWithPasswordReq = [
  body('email')
    .notEmpty().bail()
    .withMessage(validatorMessage('validation.required', 'Email'))
    .isEmail().bail()
    .withMessage(validatorMessage('validation.auth', 'Email'))
    .custom(async (val, { req }) => {
      const exist = await User.findOne({ where: { email: val } });
      if (!exist) {
        throw new Error(req.__('validation.auth', { field: 'Email' }));
      }
    }),
  body('password')
    .notEmpty()
    .withMessage(validatorMessage('validation.required', 'Password')),
];

exports.signupWithPasswordReq = [
  body('email')
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
    })
    .withMessage(validatorMessage('validation.exist', 'Email')),
  body('name')
    .trim()
    .escape()
    .notEmpty().bail()
    .withMessage(validatorMessage('validation.required', 'Name'))
    .isLength({ min: 3, max: 50 }).bail()
    .withMessage(validatorMessage('validation.length_between', {
      field: 'Name',
      min: 3,
      max: 50,
    })),
  body('password')
    .notEmpty().bail()
    .withMessage(validatorMessage('validation.required', 'Password'))
    .isLength({ min: 6 }).bail()
    .withMessage(validatorMessage('validation.length_min', {
      field: 'Password',
      min: 6,
    })),
  body('contact')
    .notEmpty().bail()
    .withMessage(validatorMessage('validation.required', 'Contact')),
];

exports.tokenRefreshReq = [
  body('refresh_token')
    .trim()
    .notEmpty()
    .withMessage(validatorMessage('validation.required')),
];
/* eslint-disable newline-per-chained-call */
