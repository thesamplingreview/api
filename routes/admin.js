const express = require('express');
const AuthMiddleware = require('../app/middlewares/auth');
const AdminCheckMiddleware = require('../app/middlewares/adminCheck');
const {
  UserController,
  AdminController,
  VendorController,
} = require('../app/controllers/admin');
const {
  UserValidator,
  AdminValidator,
  VendorValidator,
} = require('../app/middlewares/validators');

const router = express.Router();

// middlewares
router.use(AuthMiddleware);
router.use(AdminCheckMiddleware);

// admins module
router.get('/admins', AdminController.getAll);
router.get('/admins/:id', AdminController.getSingle);
router.post('/admins', AdminValidator.createReq, AdminController.create);
router.put('/admins/:id', AdminValidator.updateReq, AdminController.update);
router.delete('/admins/:id', AdminController.remove);

// users module
router.get('/users', UserController.getAll);
router.get('/users/:id', UserController.getSingle);
router.post('/users', UserValidator.createReq, UserController.create);
router.put('/users/:id', UserValidator.updateReq, UserController.update);
router.delete('/users/:id', UserController.remove);

// vendor module
router.get('/vendors', VendorController.getAll);
router.get('/vendors/:id', VendorController.getSingle);
router.post('/vendors', VendorValidator.createReq, VendorController.create);
router.put('/vendors/:id', VendorValidator.updateReq, VendorController.update);
router.delete('/vendors/:id', VendorController.remove);

module.exports = router;
