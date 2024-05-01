const { body } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { User, UserRole } = require('../../models');

const statuses = Object.values(User.STATUSES);

/* eslint-disable newline-per-chained-call */
const emailValidator = () => body('email')
  .trim()
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Email'))
  .isEmail().bail()
  .withMessage(validatorMessage('validation.invalid_email', 'Email'))
  .custom(async (val) => {
    const exist = await User.count({ where: { email: val } });
    if (exist > 0) {
      throw new Error('Invalid');
    }
    return true;
  }).bail()
  .withMessage(validatorMessage('validation.exist', 'Email'));

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

const contactValidator = () => body('contact');

const statusValidator = () => body('status')
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Status'))
  .isIn(statuses).bail()
  .withMessage(validatorMessage('validation.in', {
    field: 'Status',
    values: statuses.toString(),
  }));

const roleValidator = () => body('role_id')
  .toInt()
  .notEmpty().bail()
  .withMessage(validatorMessage('validation.required', 'Role'))
  .custom(async (val, { req }) => {
    const roles = await UserRole.scope('users').findAll({
      attributes: ['id'],
    });
    const roleIds = roles.map((d) => d.id);
    if (!roleIds.includes(val)) {
      throw new Error(req.__('validation.in', {
        field: 'Role',
        values: roleIds.toString(),
      }));
    }
    return true;
  }).bail();

// request validators
exports.createReq = [
  emailValidator(),
  nameValidator(),
  passwordValidator(),
  contactValidator().optional(),
  statusValidator().optional(),
  roleValidator().optional(),
];

exports.updateReq = [
  nameValidator().optional(),
  passwordValidator().optional(),
  contactValidator().optional(),
  statusValidator().optional(),
  roleValidator().optional(),
];

/* eslint-enable newline-per-chained-call */
