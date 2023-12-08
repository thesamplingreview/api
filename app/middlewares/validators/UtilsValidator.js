const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');

/* eslint-disable newline-per-chained-call */
const fromValidator = () => body('from')
  .trim()
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'From Email'))
  .isEmail().bail()
  .withMessage(validatorMessage('validation.invalid_email', 'From Email'));

const fromNameValidator = () => body('from_name')
  .trim();

const toValidator = () => body('to')
  .trim()
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'To Email'))
  .isEmail().bail()
  .withMessage(validatorMessage('validation.invalid_email', 'To Email'));

const subjectValidator = () => body('subject')
  .trim()
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Subject'));

const contentValidator = () => body('content')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'content'));

const useHtmlValidator = () => body('use_html')
  .toBoolean();

// request validators
exports.sendEmailReq = [
  toValidator(),
  subjectValidator(),
  contentValidator(),
  fromValidator().optional(),
  fromNameValidator().optional(),
  useHtmlValidator().optional(),
];

/* eslint-enable newline-per-chained-call */
