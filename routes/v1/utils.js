const express = require('express');
const tokenInfoMiddleware = require('../../app/middlewares/tokenInfo');
const userCheckMiddleware = require('../../app/middlewares/userCheck');
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

router.post(
  '/upload-asset',
  tokenInfoMiddleware(),
  userCheckMiddleware(),
  UtilsValidator.uploadAssetReq,
  utilsController.uploadAsset.bind(utilsController),
);

// router.post(
//   '/send-email-test',
//   utilsController.sendEmailTest.bind(utilsController),
// );

module.exports = router;
