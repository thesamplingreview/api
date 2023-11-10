const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
// const { User, UserRole, Vendor } = require('../../models');
const { createSingleUpload } = require('../../providers/upload');

/* eslint-disable newline-per-chained-call */
const logoValidator = () => {
  return createSingleUpload('logo', {
    mimeTypes: ['image/jpeg', 'image/png'],
    fileSize: 1024,
  });
};

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

// request validators
exports.createReq = [
  logoValidator(),
  nameValidator(),
  profileValidator().optional(),
];

// exports.updateReq = [
//   nameValidator.optional(),
//   passwordValidator.optional(),
//   contactValidator.optional(),
//   statusValidator.optional(),
//   vendorValidator.optional(),
//   roleValidator.optional(),
// ];

/* eslint-enable newline-per-chained-call */
