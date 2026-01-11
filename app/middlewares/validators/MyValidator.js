const { Op } = require('sequelize');
const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { User } = require('../../models');

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

const passwordValidator = () => body('password')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Password'))
  .isLength({ min: 6 }).bail()
  .withMessage(validatorMessage('validation.length_min', {
    field: 'Password',
    min: 6,
  }));
  // .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).*$/, 'g')
  // .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character');

const contactValidator = () => body('contact')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Contact'))
  .custom(async (val, { req }) => {
    const whereQuery = {
      contact: val,
    };
    // ignore current user
    if (req.user?.id) {
      whereQuery.id = { [Op.ne]: req.user.id };
    }
    const exist = await User.findOne({
      where: whereQuery,
    });
    if (exist) {
      throw new Error('Exist');
    }
    return true;
  }).bail()
  .withMessage(validatorMessage('validation.exist', 'Contact'));

/**
 * Contact validator that allows re-verification of existing contact
 * (for saveContact - allows user to verify their own existing contact)
 */
const contactValidatorAllowOwn = () => body('contact')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Contact'))
  .custom(async (val, { req }) => {
    // Get current user's contact
    const user = await User.findByPk(req.user?.id);
    const currentContact = user?.contact;
    
    // If updating to the same contact, allow it (re-verification)
    if (currentContact && currentContact === val) {
      return true;
    }
    
    // Otherwise, check if contact exists for another user
    const whereQuery = {
      contact: val,
    };
    if (req.user?.id) {
      whereQuery.id = { [Op.ne]: req.user.id };
    }
    const exist = await User.findOne({
      where: whereQuery,
    });
    if (exist) {
      throw new Error('Exist');
    }
    return true;
  }).bail()
  .withMessage(validatorMessage('validation.exist', 'Contact'));

const codeValidator = () => body('code')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Code'));

/* eslint-enable newline-per-chained-call */

exports.updateReq = [
  nameValidator().optional(),
  passwordValidator().optional(),
];

exports.changeContactReq = [
  contactValidator(),
  codeValidator(),
];

/**
 * Save contact with OTP verification (using Evolution API)
 * Allows re-verification of existing contact
 */
exports.saveContactReq = [
  contactValidatorAllowOwn(),
  codeValidator(),
];
