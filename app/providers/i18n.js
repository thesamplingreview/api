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

module.exports = i18n;
