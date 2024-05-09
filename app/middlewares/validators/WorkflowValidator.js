const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { Vendor } = require('../../models');

/* eslint-disable newline-per-chained-call */
const nameValidator = () => body('name')
  .trim()
  .escape()
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Name'));

const vendorValidator = () => body('vendor_id')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Vendor'))
  .custom(async (val, { req }) => {
    const vendor = await Vendor.findByPk(val);
    if (!vendor) {
      return Promise.reject();
    }
    req.vendor = vendor;
    return Promise.resolve();
  }).bail()
  .withMessage(validatorMessage('validation.not_exist', 'Vendor'));

const tasksValidator = ({ optional = false } = {}) => {
  const fieldName = 'tasks';
  const bodyChain = body(fieldName)
    .isArray({ min: 0 }).bail()
    .withMessage(validatorMessage('validation.array', 'Tasks'));
  if (optional) {
    bodyChain.optional();
  }

  return [
    bodyChain,
    body(`${fieldName}.*.id`)
      .trim()
      .notEmpty().bail()
      .withMessage(validatorMessage('validation.required', 'field.id')),
    body(`${fieldName}.*.name`)
      .trim()
      .notEmpty().bail()
      .withMessage(validatorMessage('validation.required', 'field.name')),
    body(`${fieldName}.*.type`)
      .notEmpty().bail()
      .withMessage(validatorMessage('validation.required', 'field.type')),
    body(`${fieldName}.*.config`)
      .isObject().bail()
      .withMessage(validatorMessage('validation.object', 'field.config'))
      .optional({ values: 'falsy' }),
    body(`${fieldName}.*.parent_task_id`)
      .optional({ values: 'falsy' })
      .custom((val, { req }) => {
        const exists = req.body[fieldName].some((d) => d.id.toString() === val.toString());
        if (!exists) {
          throw new Error('Invalid parent_task_id');
        }
        return true;
      }),
  ];
};

// request validators
exports.createReq = [
  nameValidator(),
  vendorValidator().optional(),
];

exports.updateReq = [
  nameValidator().optional(),
  vendorValidator().optional(),
];

exports.updateTasksReq = [
  tasksValidator(),
];

/* eslint-enable newline-per-chained-call */
