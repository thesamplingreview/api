const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');

/* eslint-disable newline-per-chained-call */
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

const passwordValidator = () => body('password')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Password'))
  .isLength({ min: 6 }).bail()
  .withMessage(validatorMessage('validation.length_min', {
    field: 'Password',
    min: 6,
  }));
  // .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).*$/, 'g')
  // .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character');

const contactValidator = () => body('contact');

/* eslint-enable newline-per-chained-call */

exports.updateReq = [
  nameValidator().optional(),
  passwordValidator().optional(),
  contactValidator().optional(),
];
