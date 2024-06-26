const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { parseFormData, validatorFileCheck } = require('../../helpers/upload');

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

exports.uploadAssetReq = [
  parseFormData({
    fileFields: ['file'],
  }),
  body('file')
    .notEmpty().bail()
    .withMessage(validatorMessage('validation.required', 'File'))
    .custom(validatorFileCheck({
      maxFileSize: 4 * 1024 * 1024, // 4Mb
      // **allow all types
      // mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    })).bail(),
  body('caption').optional(),
  body('tags').optional(),
];

exports.s3PresignedUrlReq = [
  body('filename')
    .notEmpty().bail()
    .withMessage(validatorMessage('validation.required', 'filename')),
  body('filesize')
    .toInt()
    .optional(),
  body('mimetype')
    .optional(),
];

/* eslint-enable newline-per-chained-call */
