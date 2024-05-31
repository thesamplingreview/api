const express = require('express');
const tokenInfoMiddleware = require('../../app/middlewares/tokenInfo');
const userCheckMiddleware = require('../../app/middlewares/userCheck');
const {
  UserController,
  AdminController,
  FormController,
  CampaignController,
  EnrolmentController,
  ReviewController,
  ProductController,
  ReportController,
  WorkflowController,
} = require('../../app/controllers/vendor');
const {
  AdminValidator,
  FormValidator,
  CampaignValidator,
  EnrolmentValidator,
  ProductValidator,
  WorkflowValidator,
} = require('../../app/middlewares/validators');

const router = express.Router();

// middlewares
router.use(tokenInfoMiddleware());
router.use(userCheckMiddleware('vendor'));

// admins module
router.get('/admins', AdminController.getAll);
router.get('/admins/all/options', AdminController.options);
router.get('/admins/:id', AdminController.getSingle);
router.post('/admins', AdminValidator.vendorCreateReq, AdminController.create);
router.put('/admins/:id', AdminValidator.vendorUpdateReq, AdminController.update);
router.delete('/admins/:id', AdminController.remove);

// users module
router.get('/users', UserController.getAll);
router.get('/users/all/options', UserController.options);
router.get('/users/:id', UserController.getSingle);

// form module
router.get('/forms', FormController.getAll);
router.get('/forms/all/options', FormController.options);
router.get('/forms/:id', FormController.getSingle);
router.post('/forms', FormValidator.createReq, FormController.create);
router.put('/forms/:id', FormValidator.updateReq, FormController.update);
router.put('/forms/:id/fields', FormValidator.updateFieldsReq, FormController.updateFields);
router.delete('/forms/:id', FormController.remove);

// campaign module
router.get('/campaigns', CampaignController.getAll);
router.get('/campaigns/all/options', CampaignController.options);
router.get('/campaigns/:id', CampaignController.getSingle);
router.get('/campaigns/:id/report/stats', CampaignController.getReportStats);
router.get('/campaigns/:id/report/counts', CampaignController.getReportCounts);
router.post('/campaigns', CampaignValidator.createReq, CampaignController.create);
router.put('/campaigns/:id', CampaignValidator.updateReq, CampaignController.update);
router.delete('/campaigns/:id', CampaignController.remove);
router.put('/campaigns/:id/products', CampaignValidator.productsReq, CampaignController.updateProducts);

// enrolment module
router.get('/enrolments', EnrolmentController.getAll);
router.get('/enrolments/all/options', EnrolmentController.options);
router.get('/enrolments/:id', EnrolmentController.getSingle);
router.put('/enrolments/:id', EnrolmentValidator.settingUpdateReq, EnrolmentController.update);
router.delete('/enrolments/:id', EnrolmentController.remove);

// review module
router.get('/reviews', ReviewController.getAll);
router.get('/reviews/all/options', ReviewController.options);
router.get('/reviews/:id', ReviewController.getSingle);
// router.put('/reviews/:id', ReviewController.settingUpdateReq, EnrolmentController.update);
router.delete('/reviews/:id', ReviewController.remove);

// product module
router.get('/products', ProductController.getAll);
router.get('/products/all/options', ProductController.options);
router.get('/products/:id', ProductController.getSingle);
router.post('/products', ProductValidator.createReq, ProductController.create);
router.put('/products/:id', ProductValidator.updateReq, ProductController.update);
router.delete('/products/:id', ProductController.remove);

// report module
router.get('/report/enrolments', ReportController.countEnrolments);

// workflow module
router.get('/workflows', WorkflowController.getAll);
router.get('/workflows/all/options', WorkflowController.options);
router.get('/workflows/:id', WorkflowController.getSingle);
router.post('/workflows', WorkflowValidator.createReq, WorkflowController.create);
router.put('/workflows/:id', WorkflowValidator.updateReq, WorkflowController.update);
router.put('/workflows/:id/tasks', WorkflowValidator.updateTasksReq, WorkflowController.updateTasks);
router.delete('/workflows/:id', WorkflowController.remove);
router.put('/campaign-workflow/:id/trigger', WorkflowController.triggerCampaignWorkflow);

module.exports = router;
