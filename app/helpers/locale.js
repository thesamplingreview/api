const path = require('path');
const i18n = require('i18n');

i18n.configure({
  locales: ['en'],
  defaultLocale: 'en',
  cookie: 'lang',
  directory: path.join(process.cwd(), 'locales'),
  objectNotation: true,
  // updateFiles: false,
  // logDebugFn: function (msg) {
  //   console.log('debug', msg)
  // },
});

/**
 * Validator message translation
 */
function validatorMessage(message, field = '') {
  return (val, { req, path: fieldName }) => {
    let attrMap = {};
    if (field && typeof field === 'object') {
      attrMap = field;
    } else {
      attrMap.field = field || fieldName;
    }
    // eslint-disable-next-line no-underscore-dangle
    return req.__(message, attrMap);
  };
}

module.exports = {
  i18n,
  validatorMessage,
};
