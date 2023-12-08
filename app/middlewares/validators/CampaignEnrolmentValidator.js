const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { Campaign, CampaignEnrolment, Form } = require('../../models');

/* eslint-disable newline-per-chained-call */
const campaignValidator = () => body('campaign_id')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Campaign'))
  .custom(async (val, { req }) => {
    // check if campaign_id valid
    const campaign = await Campaign.findByPk(val);
    if (!campaign) {
      throw new Error(req.__('validation.not_exist', { field: 'Campaign' }));
    }
    // check if user enroled before
    const enrolment = await CampaignEnrolment.findOne({
      where: {
        campaign_id: val,
        user_id: req.user?.id,
      },
    });
    if (enrolment) {
      throw new Error('User already enroled in this campaign');
    }
    // continue
    req.campaign = campaign;
    return true;
  }).bail();

const formValidator = () => body('form_id')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Form'))
  .custom(async (val, { req }) => {
    const form = await Form.findByPk(val);
    if (!form) {
      throw new Error('Invalid');
    }
    req.form = form;
    return true;
  }).bail()
  .withMessage(validatorMessage('validation.not_exist', 'Form'));

const submissionsValidator = () => body('submissions')
  .isJSON().bail()
  .withMessage(validatorMessage('validation.json', 'Submissions'))
  .customSanitizer((value) => {
    try {
      return value ? JSON.parse(value) : null;
    } catch (err) {
      return null;
    }
  });

/* eslint-enable newline-per-chained-call */

// request validators
exports.createReq = [
  campaignValidator(),
  formValidator(),
  submissionsValidator(),
];
