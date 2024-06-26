const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { parseFormData, validatorFileCheck } = require('../../helpers/upload');
const { User } = require('../../models');

/* eslint-disable newline-per-chained-call */
const logoValidator = () => body('logo')
  .custom(validatorFileCheck({
    maxFileSize: 2 * 1024 * 1024, // 2Mb
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  })).bail();

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

const profileValidator = () => body('profile');

const adminEmailValidator = () => body('admin_email')
  .trim()
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Admin Email'))
  .isEmail().bail()
  .withMessage(validatorMessage('validation.invalid_email', 'Admin Email'))
  .custom(async (val) => {
    const exist = await User.count({ where: { email: val } });
    if (exist > 0) {
      throw new Error('Invalid');
    }
    return true;
  }).bail()
  .withMessage(validatorMessage('validation.exist', 'Admin Email'));

const adminNameValidator = () => body('admin_name')
  .trim()
  .escape()
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Admin Name'))
  .isLength({ min: 3, max: 50 }).bail()
  .withMessage(validatorMessage('validation.length_between', {
    field: 'Admin Name',
    min: 3,
    max: 50,
  }));

const adminPasswordValidator = () => body('admin_password')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Password'))
  .isLength({ min: 6 }).bail()
  .withMessage(validatorMessage('validation.length_min', {
    field: 'Password',
    min: 6,
  }));

// request validators
exports.createReq = [
  parseFormData({
    fileFields: ['logo'],
  }),
  nameValidator(),
  logoValidator().optional(),
  profileValidator().optional(),
  adminNameValidator(),
  adminEmailValidator(),
  adminPasswordValidator(),
];

exports.updateReq = [
  parseFormData({
    fileFields: ['logo'],
  }),
  nameValidator(),
  logoValidator().optional(),
  profileValidator().optional(),
];

/* eslint-enable newline-per-chained-call */
