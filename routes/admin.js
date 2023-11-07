const express = require('express');
const auth = require('../app/middlewares/auth');
const {
  UserController,
  VendorController,
} = require('../app/controllers/admin');
const { UserValidator } = require('../app/middlewares/validators');

const router = express.Router();

// middlewares
router.use(auth);

// users module
router.get('/users', UserController.getAll);
router.get('/users/:id', UserController.getSingle);
router.post('/users', UserValidator.createReq, UserController.create);
router.put('/users/:id', UserValidator.updateReq, UserController.update);
router.delete('/users/:id', UserController.remove);

// vendor module
router.get('/vendors', VendorController.getAll);
router.get('/vendors/:id', VendorController.getSingle);
router.post('/vendors', VendorController.create);
router.put('/vendors/:id', VendorController.update);
router.delete('/vendors/:id', VendorController.remove);

module.exports = router;
