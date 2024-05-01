const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');

/* eslint-disable newline-per-chained-call */
const nameValidator = () => body('name')
  .trim()
  .escape()
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Name'))
  .isLength({ min: 3 }).bail()
  .withMessage(validatorMessage('validation.length_min', {
    field: 'Name',
    min: 3,
  }));

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
      .notEmpty().bail()
      .withMessage(validatorMessage('validation.required', 'field.name')),
    body(`${fieldName}.*.type`)
      .notEmpty().bail()
      .withMessage(validatorMessage('validation.required', 'field.type')),
    body(`${fieldName}.*.options`)
      .isArray({ min: 0 }).bail()
      .withMessage(validatorMessage('validation.array', 'field.options'))
      .custom((val, { req, path }) => {
        const match = path.match(/\[(\d+)\]/);
        if (!match?.[1]) {
          throw new Error('Incorrect options structure.');
        }
        const index = parseInt(match[1], 10);
        const currentField = req.body.fields[index];
        // apply to select type only
        if (currentField?.type === 'select') {
          const isValid = val.every((d) => d.key && d.label);
          if (!isValid) {
            throw new Error('Missing key-label pair.');
          }
        }
        return true;
      })
      .optional(),
    body(`${fieldName}.*.config`)
      .isObject().bail()
      .withMessage(validatorMessage('validation.object', 'field.config'))
      .optional({ values: 'falsy' }),
    body(`${fieldName}.*.id`)
      .toInt(),
    body(`${fieldName}.*.mandatory`)
      .toBoolean(),
    body(`${fieldName}.*.status`)
      .toBoolean(),
    body(`${fieldName}.*.use_logic`)
      .toBoolean(),
    body(`${fieldName}.*.logic`)
      .isArray().bail()
      .withMessage(validatorMessage('validation.array', 'field.logic'))
      .optional({ values: 'falsy' }),
  ];
};

// request validators
exports.createReq = [
  nameValidator(),
  descValidator().optional(),
  // fieldsValidator({ optional: true }),
];

exports.updateReq = [
  nameValidator().optional(),
  descValidator().optional(),
];

exports.updateFieldsReq = [
  fieldsValidator(),
];

/* eslint-enable newline-per-chained-call */
