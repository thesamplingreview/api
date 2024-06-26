const ApiController = require('../controllers/ApiController');

const errorHandler = (err, req, res, next) => {
  const controller = new ApiController();
  console.log(err);
  return controller.responseError(req, res, err);
};

module.exports = errorHandler;
