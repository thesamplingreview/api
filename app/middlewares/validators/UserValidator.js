const { body, check } = require('express-validator');
const { validatorMessage } = require('../../helpers/locale');
const { User } = require('../../models');

const statuses = ['active', 'inactive'];
const role_ids = [1, 2, 3];

exports.createReq = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage(validatorMessage('validation.required', 'Email'))
    .bail()
    .isEmail()
    .withMessage(validatorMessage('validation.invalid_email', 'Email'))
    .bail()
    .custom(async (val, { req }) => {
      const exist = await User.findOne({ where: { email: val } });
      if (exist) {
        throw new Error(req.__('validation.exists', { field: 'Email' }));
      }
    }),
  body('name')
    .trim()
    .escape()
    .notEmpty()
    .withMessage(validatorMessage('validation.required', 'Name'))
    .bail()
    .isLength({ min: 3, max: 50 })
    .withMessage(validatorMessage('validation.length_between', {
      field: 'Name',
      min: 3,
      max: 50,
    })),
  body('password')
    .optional()
    .exists()
    .notEmpty()
    .withMessage(validatorMessage('validation.required', 'Password'))
    .bail()
    .isLength({ min: 6 })
    .withMessage(validatorMessage('validation.length_min', {
      field: 'Password',
      min: 6,
    }))
    .bail(),
    // .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).*$/, 'g')
    // .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character'),
  body('contact')
    .optional(),
];

exports.updateReq = [
  body('name')
    .optional()
    .exists()
    .trim()
    .escape()
    .notEmpty()
    .withMessage(validatorMessage('validation.required', 'Name'))
    .bail()
    .isLength({ min: 3, max: 50 })
    .withMessage(validatorMessage('validation.length_between', {
      field: 'Name',
      min: 3,
      max: 50,
    })),
  body('password')
    .optional()
    .exists()
    .notEmpty()
    .withMessage(validatorMessage('validation.required', 'Password'))
    .bail()
    .isLength({ min: 6 })
    .withMessage(validatorMessage('validation.length_min', {
      field: 'Password',
      min: 6,
    })),
  body('contact')
    .optional(),
  body('status')
    .optional()
    .exists()
    .notEmpty()
    .withMessage(validatorMessage('validation.required', 'Status'))
    .bail()
    .isIn(statuses)
    .withMessage(validatorMessage('validation.in', {
      field: 'Status',
      values: statuses.join(', '),
    })),
  body('role_id')
    .optional()
    .exists()
    .notEmpty()
    .withMessage(validatorMessage('validation.required', 'Role ID'))
    .bail()
    .isIn(role_ids)
    .withMessage(validatorMessage('validation.in', {
      field: 'Role ID',
      values: role_ids.join(', '),
    })),
];
