const fs = require('fs');
const path = require('path');

// Helper function to bind methods
function bindMethods(controller) {
  return Object.getOwnPropertyNames(Object.getPrototypeOf(controller)).reduce(
    (boundController, key) => {
      if (typeof controller[key] === 'function') {
        boundController[key] = controller[key].bind(controller);
      }
      return boundController;
    },
    {},
  );
}

// Automatically import and bind all controllers
const controllers = {};

fs.readdirSync(__dirname)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'))
  .forEach((file) => {
    const controllerName = path.basename(file, '.js');
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const Controller = require(`./${controllerName}`);
    controllers[controllerName] = bindMethods(new Controller());
  });

module.exports = controllers;
