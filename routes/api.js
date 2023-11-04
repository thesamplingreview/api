const express = require('express');
const auth = require('../app/middlewares/auth');
const { UserController } = require('../app/controllers/api');

const router = express.Router();

// user routes
router.get('/users/all', [auth], UserController.getAll);
router.post('/users/create', [auth], UserController.create);

// sample
router.get('/sample', (req, res) => {
  res.json({ message: 'This is a sample route.' });
});

module.exports = router;
