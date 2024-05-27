const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { Vendor, Campaign, CampaignWorkflow } = require('../../models');

const triggers = Object.values(CampaignWorkflow.TRIGGERS);

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

const campaignValidator = () => body('campaign_id')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Campaign'))
  .custom(async (val, { req }) => {
    const campaign = await Campaign.findByPk(val);
    if (!campaign) {
      return Promise.reject();
    }
    req.campaign = campaign;
    return Promise.resolve();
  }).bail()
  .withMessage(validatorMessage('validation.not_exist', 'Campaign'));

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

const triggerValidator = () => body('trigger')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Trigger'))
  .isIn(triggers).bail()
  .withMessage(validatorMessage('validation.in', {
    field: 'Trigger',
    values: triggers.toString(),
  }));

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
    body(`${fieldName}.*.action`)
      .notEmpty().bail()
      .withMessage(validatorMessage('validation.required', 'field.action')),
    body(`${fieldName}.*.pos`),
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
  campaignValidator(),
  triggerValidator(),
  vendorValidator().optional(),
];

exports.updateReq = [
  nameValidator().optional(),
  // vendorValidator().optional(),
  // triggerValidator().optional(),
];

exports.updateTasksReq = [
  tasksValidator(),
];

/* eslint-enable newline-per-chained-call */
