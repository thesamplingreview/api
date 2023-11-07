const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { User } = require('../../models');

exports.loginWithPasswordReq = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage(validatorMessage('validation.required', 'Email'))
    .bail()
    .isEmail()
    .withMessage(validatorMessage('validation.auth', 'Email'))
    .bail()
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

exports.tokenRefreshReq = [
  body('refresh_token')
    .trim()
    .notEmpty()
    .withMessage(validatorMessage('validation.required')),
];
