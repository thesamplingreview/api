const express = require('express');
const tokenInfoMiddleware = require('../../app/middlewares/tokenInfo');
const userCheckMiddleware = require('../../app/middlewares/userCheck');
const {
  MyController,
  CampaignController,
} = require('../../app/controllers/app');
const {
  MyValidator,
  AppCampaignValidator,
} = require('../../app/middlewares/validators');

// allow public & auth protected routes
const publicRouter = express.Router();
publicRouter.use(tokenInfoMiddleware(false));

const authRouter = express.Router();
authRouter.use(tokenInfoMiddleware(true));
authRouter.use(userCheckMiddleware());

// campaign module
publicRouter.get('/campaigns', CampaignController.getAll);
publicRouter.get('/campaigns/:slug', CampaignController.getSingle);
authRouter.post('/campaigns/:slug/enrolment', AppCampaignValidator.createEnrolmentReq, CampaignController.createEnrolment);
authRouter.post('/campaigns/:slug/review', AppCampaignValidator.postReviewReq, CampaignController.postReview);

// my module
authRouter.get('/my/campaigns', MyValidator.updateReq, MyController.getCampaigns);

const router = express.Router();
router.use(publicRouter);
router.use(authRouter);

module.exports = router;
