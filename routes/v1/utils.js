const express = require('express');
const appKeyCheckMiddleware = require('../../app/middlewares/appKeyCheck');
const { UtilsValidator } = require('../../app/middlewares/validators');
const UtilsController = require('../../app/controllers/UtilsController');

const router = express.Router();

// utils module
const utilsController = new UtilsController();

router.post(
  '/send-email',
  appKeyCheckMiddleware(),
  UtilsValidator.sendEmailReq,
  utilsController.sendEmail.bind(utilsController),
);

module.exports = router;
