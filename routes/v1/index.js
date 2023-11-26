const express = require('express');

const router = express.Router();

// API routes
router.use('/auth', require('./auth'));
router.use('/admin', require('./admin'));

module.exports = router;
