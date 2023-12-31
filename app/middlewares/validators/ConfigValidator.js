const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');

/* eslint-disable newline-per-chained-call */
const configsValidator = () => {
  const fieldName = 'configs';
  return [
    body(fieldName)
      .isArray({ min: 0 }).bail()
      .withMessage(validatorMessage('validation.array', 'Configs')),
    body(`${fieldName}.*.key`)
      .trim()
      .escape()
      .notEmpty().bail()
      .withMessage(validatorMessage('validation.required', 'config.key'))
      .isAlphanumeric(undefined, { ignore: '-_' }).bail()
      .withMessage(validatorMessage('validation.alphanumeric', 'config.key')),
    body(`${fieldName}.*.value`),
  ];
};

// request validators
exports.saveReq = [
  configsValidator(),
];

/* eslint-enable newline-per-chained-call */
