const { param, body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { Campaign, Form } = require('../../models');

/* eslint-disable newline-per-chained-call */
const slugValidator = () => param('slug')
  .custom(async (val, { req }) => {
    const campaign = await Campaign.findOne({
      where: { slug: val },
    });
    if (!campaign) {
      throw new Error('Invalid');
    }
    req.campaign = campaign;
    return true;
  })
  .withMessage(validatorMessage('validation.exist', 'Slug'));

// request validators
exports.createEnrolmentReq = [
  slugValidator(),
  body('form_id')
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
    .withMessage(validatorMessage('validation.not_exist', 'Form')),
  body('submissions')
    .isJSON().bail()
    .withMessage(validatorMessage('validation.json', 'Submissions'))
    .customSanitizer((value) => {
      try {
        return value ? JSON.parse(value) : null;
      } catch (err) {
        return null;
      }
    }),
];

exports.createReviewReq = [
  slugValidator(),
  body('rating')
    .notEmpty().bail()
    .withMessage(validatorMessage('validation.required', 'Rating'))
    .toInt(),
  body('review')
    .optional(),
];

/* eslint-enable newline-per-chained-call */
