const fs = require('fs');
const path = require('path');
const express = require('express');

const router = express.Router();

fs.readdirSync(__dirname)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'))
  .forEach((file) => {
    const route = path.basename(file, '.js');
    // eslint-disable-next-line global-require, import/no-dynamic-require
    router.use(`/${route}`, require(`./${route}`));
  });

module.exports = router;
