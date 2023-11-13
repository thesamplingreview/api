const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { parseFormData, validatorFileCheck } = require('../../helpers/upload');

/* eslint-disable newline-per-chained-call */
const imageValidator = () => body('image')
  .custom(validatorFileCheck({
    maxFileSize: 2 * 1024 * 1024, // 2Mb
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  })).bail();

const nameValidator = () => body('name')
  .trim()
  .escape()
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Name'));

const descValidator = () => body('description');

const brandValidator = () => body('brand');

const statusValidator = () => body('status')
  .toBoolean();

const posValidator = () => body('pos')
  .toInt();

// request validators
exports.createReq = [
  parseFormData({
    fileFields: ['image'],
  }),
  nameValidator(),
  descValidator().optional(),
  imageValidator().optional(),
  brandValidator().optional(),
  statusValidator().optional(),
  posValidator().optional(),
];

exports.updateReq = [
  parseFormData({
    fileFields: ['cover'],
  }),
  nameValidator(),
  descValidator().optional(),
  imageValidator().optional(),
  brandValidator().optional(),
  statusValidator().optional(),
  posValidator().optional(),
];

/* eslint-enable newline-per-chained-call */
