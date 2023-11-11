const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { parseFormData, validatorCheck } = require('../../helpers/upload');

/* eslint-disable newline-per-chained-call */
const logoValidator = () => body('logo')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Logo'))
  .custom(validatorCheck({
    maxFileSize: 2 * 1024 * 1024, // 2Mb
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  })).bail();

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

const profileValidator = () => body('profile');

// request validators
exports.createReq = [
  parseFormData({
    fileFields: ['logo'],
  }),
  nameValidator(),
  logoValidator().optional(),
  profileValidator().optional(),
];

exports.updateReq = [
  parseFormData({
    fileFields: ['logo'],
  }),
  nameValidator(),
  logoValidator().optional(),
  profileValidator().optional(),
];

/* eslint-enable newline-per-chained-call */
