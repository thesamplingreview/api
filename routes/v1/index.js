const express = require('express');

const router = express.Router();

// API routes
router.use('/auth', require('./auth'));
router.use('/admin', require('./admin'));
router.use('/app', require('./app'));
router.use('/utils', require('./utils'));

module.exports = router;
