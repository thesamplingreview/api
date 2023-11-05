const express = require('express');
const auth = require('../app/middlewares/auth');
const { UserController } = require('../app/controllers/admin');
const { UserValidator } = require('../app/middlewares/validators');

const router = express.Router();

// users module
router.get('/users', [auth], UserController.getAll);
router.get('/users/:id', [auth], UserController.getSingle);
router.post('/users', [auth], UserValidator.createReq, UserController.create);
router.put('/users/:id', [auth], UserValidator.updateReq, UserController.update);
router.delete('/users/:id', [auth], UserController.remove);

// sample
router.get('/sample', (req, res) => {
  res.json({ message: 'This is a sample route.' });
});

module.exports = router;
