const express = require('express');
const tokenInfoMiddleware = require('../../app/middlewares/tokenInfo');
const userCheckMiddleware = require('../../app/middlewares/userCheck');
const appKeyCheckMiddleware = require('../../app/middlewares/appKeyCheck');
const { UtilsValidator } = require('../../app/middlewares/validators');
const UtilsController = require('../../app/controllers/UtilsController');
const CronController = require('../../app/controllers/CronController');

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

router.post(
  '/test-email',
  appKeyCheckMiddleware(),
  utilsController.sendTestEmail.bind(utilsController),
);

router.post(
  '/test-sms',
  appKeyCheckMiddleware(),
  utilsController.sendTestSMS.bind(utilsController),
);

// cron module
const cronController = new CronController();

router.get(
  '/run-cron-queue',
  appKeyCheckMiddleware(),
  cronController.triggerQueueTask.bind(cronController),
);
router.get(
  '/test-trigger',
  cronController.testWorkflowTrigger.bind(cronController),
);

module.exports = router;
