const express = require('express');
const tokenInfoMiddleware = require('../../app/middlewares/tokenInfo');
const userCheckMiddleware = require('../../app/middlewares/userCheck');
const {
  UserController,
  AdminController,
  VendorController,
  FormController,
  CampaignController,
  EnrolmentController,
  ProductController,
} = require('../../app/controllers/admin');
const {
  UserValidator,
  AdminValidator,
  VendorValidator,
  FormValidator,
  CampaignValidator,
  CampaignEnrolmentValidator,
  ProductValidator,
} = require('../../app/middlewares/validators');

const router = express.Router();

// middlewares
router.use(tokenInfoMiddleware());
router.use(userCheckMiddleware('admin'));

// admins module
router.get('/admins', AdminController.getAll);
router.get('/admins/all/options', AdminController.options);
router.get('/admins/:id', AdminController.getSingle);
router.post('/admins', AdminValidator.createReq, AdminController.create);
router.put('/admins/:id', AdminValidator.updateReq, AdminController.update);
router.delete('/admins/:id', AdminController.remove);

// users module
router.get('/users', UserController.getAll);
router.get('/users/all/options', UserController.options);
router.get('/users/:id', UserController.getSingle);
router.post('/users', UserValidator.createReq, UserController.create);
router.put('/users/:id', UserValidator.updateReq, UserController.update);
router.delete('/users/:id', UserController.remove);

// vendor module
router.get('/vendors', VendorController.getAll);
router.get('/vendors/all/options', VendorController.options);
router.get('/vendors/:id', VendorController.getSingle);
router.post('/vendors', VendorValidator.createReq, VendorController.create);
router.put('/vendors/:id', VendorValidator.updateReq, VendorController.update);
router.delete('/vendors/:id', VendorController.remove);

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
router.put('/enrolments/:id', CampaignEnrolmentValidator.settingUpdateReq, EnrolmentController.update);
router.delete('/enrolments/:id', EnrolmentController.remove);

// product module
router.get('/products', ProductController.getAll);
router.get('/products/all/options', ProductController.options);
router.get('/products/:id', ProductController.getSingle);
router.post('/products', ProductValidator.createReq, ProductController.create);
router.put('/products/:id', ProductValidator.updateReq, ProductController.update);
router.delete('/products/:id', ProductController.remove);

module.exports = router;
