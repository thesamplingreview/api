const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { parseFormData, validatorFileCheck } = require('../../helpers/upload');

/* eslint-disable newline-per-chained-call */
const coverValidator = () => body('cover')
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

const fieldsValidator = ({ optional = false } = {}) => {
  const fieldName = 'fields';
  const bodyChain = body(fieldName)
    .isArray({ min: 0 }).bail()
    .withMessage(validatorMessage('validation.array', 'Fields'));
  if (optional) {
    bodyChain.optional();
  }

  return [
    bodyChain,
    body(`${fieldName}.*.name`)
      .trim()
      .escape()
      .notEmpty().bail()
      .withMessage(validatorMessage('validation.required', 'field.name')),
    body(`${fieldName}.*.type`)
      .notEmpty().bail()
      .withMessage(validatorMessage('validation.required', 'field.type')),
    body(`${fieldName}.*.config`)
      .isJSON().bail()
      .withMessage(validatorMessage('validation.json', 'field.config'))
      .customSanitizer((value) => {
        try {
          return value ? JSON.parse(value) : null;
        } catch (err) {
          return null;
        }
      })
      .optional({ values: 'falsy' }),
    body(`${fieldName}.*.id`)
      .toInt(),
    body(`${fieldName}.*.mandatory`)
      .toBoolean(),
    body(`${fieldName}.*.status`)
      .toBoolean(),
  ];
};

// request validators
exports.createReq = [
  parseFormData({
    fileFields: ['cover'],
  }),
  nameValidator(),
  coverValidator().optional(),
  descValidator().optional(),
  fieldsValidator({ optional: true }),
];

exports.updateReq = [
  parseFormData({
    fileFields: ['cover'],
  }),
  nameValidator(),
  coverValidator().optional(),
  descValidator().optional(),
];

exports.updateFieldsReq = [
  fieldsValidator(),
];

/* eslint-enable newline-per-chained-call */
