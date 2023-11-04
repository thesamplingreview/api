const fs = require('fs');
const path = require('path');

const errors = {};

fs.readdirSync(__dirname)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'))
  .forEach((file) => {
    const errorName = path.basename(file, '.js');
    // eslint-disable-next-line global-require, import/no-dynamic-require
    errors[errorName] = require(`./${file}`);
  });

module.exports = errors;
