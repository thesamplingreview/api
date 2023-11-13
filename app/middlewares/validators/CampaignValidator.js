const { Op } = require('sequelize');
const { body } = require('express-validator');
const { toDate } = require('../../helpers/utils');
const { validatorMessage } = require('../../helpers/locale');
const { parseFormData, validatorFileCheck } = require('../../helpers/upload');
const { Campaign, Vendor, Form } = require('../../models');

/* eslint-disable newline-per-chained-call */
const coverValidator = () => body('cover')
  .custom(validatorFileCheck({
    maxFileSize: 2 * 1024 * 1024, // 2Mb
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  })).bail();

const slugValidator = ({ paramId } = {}) => body('slug')
  .trim()
  .escape()
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Slug'))
  .isSlug().bail()
  .withMessage(validatorMessage('validation.slug', 'Slug'))
  .custom(async (val, { req }) => {
    const whereQuery = { slug: val };
    if (paramId) {
      whereQuery.id = { [Op.ne]: req.params[paramId] };
    }
    const exist = await Campaign.count({
      where: whereQuery,
    });
    return exist === 0;
  })
  .withMessage(validatorMessage('validation.exist', 'Slug'));

const nameValidator = () => body('name')
  .trim()
  .escape()
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Name'));

const descValidator = () => body('description');

const metaTitleValidator = () => body('meta_title');

const metaDescValidator = () => body('meta_desc');

const metaKeywordsValidator = () => body('meta_keywords');

const startDateValidator = () => body('start_date')
  .custom((val) => {
    return !(val && !toDate(val));
  }).bail()
  .withMessage(validatorMessage('validation.date', 'Start Date'));

const endDateValidator = () => body('end_date')
  .custom((val) => {
    return !(val && !toDate(val));
  }).bail()
  .withMessage(validatorMessage('validation.date', 'End Date'));

const statusValidator = () => body('status')
  .toBoolean();

const posValidator = () => body('pos')
  .toInt();

const vendorValidator = () => body('vendor_id')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Vendor'))
  .custom(async (val, { req }) => {
    const vendor = await Vendor.findByPk(val);
    if (!vendor) {
      throw new Error('Invalid');
    }
    req.vendor = vendor;
    return true;
  }).bail()
  .withMessage(validatorMessage('validation.not_exist', 'Vendor'));

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

// request validators
exports.createReq = [
  parseFormData({
    fileFields: ['cover'],
  }),
  slugValidator(),
  nameValidator(),
  descValidator().optional(),
  coverValidator().optional(),
  startDateValidator().optional({ values: 'falsy' }),
  endDateValidator().optional({ values: 'falsy' }),
  vendorValidator().optional({ values: 'falsy' }),
  formValidator().optional({ values: 'falsy' }),
  metaTitleValidator().optional(),
  metaDescValidator().optional(),
  metaKeywordsValidator().optional(),
  statusValidator().optional(),
  posValidator().optional(),
];

exports.updateReq = [
  parseFormData({
    fileFields: ['cover'],
  }),
  slugValidator({ paramId: 'id' }),
  nameValidator(),
  descValidator().optional(),
  coverValidator().optional(),
  startDateValidator().optional({ values: 'falsy' }),
  endDateValidator().optional({ values: 'falsy' }),
  vendorValidator().optional({ values: 'falsy' }),
  formValidator().optional({ values: 'falsy' }),
  metaTitleValidator().optional(),
  metaDescValidator().optional(),
  metaKeywordsValidator().optional(),
  statusValidator().optional(),
  posValidator().optional(),
];

/* eslint-enable newline-per-chained-call */
