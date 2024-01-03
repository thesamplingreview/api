const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { CampaignEnrolment } = require('../../models');

/* eslint-disable newline-per-chained-call */
const statusValidator = () => body('status')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Status'))
  .isIn(Object.values(CampaignEnrolment.STATUSES)).bail()
  .withMessage(validatorMessage('validation.in', {
    field: 'Status',
    values: Object.values(CampaignEnrolment.STATUSES).toString(),
  }));

exports.settingUpdateReq = [
  statusValidator(),
];

/* eslint-enable newline-per-chained-call */
