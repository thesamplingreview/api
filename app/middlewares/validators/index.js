const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const { ValidationFailed } = require('../../errors');
const ApiController = require('../../controllers/ApiController');

// validation failed handler
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationError = new ValidationFailed(errors.array());
    const apiController = new ApiController();
    return apiController.responseError(req, res, validationError);
  }
  return next();
}

const validators = {};

fs.readdirSync(__dirname)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'))
  .forEach((file) => {
    const validatorName = path.basename(file, '.js');
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const validator = require(`./${file}`);
    validators[validatorName] = Object.keys(validator).reduce((acc, key) => {
      acc[key] = [
        ...validator[key],
        handleValidationErrors,
      ];
      return acc;
    }, {});
  });

module.exports = validators;
