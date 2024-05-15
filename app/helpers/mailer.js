// define which services will be using here
// const { sendMail, sendMailUsingTmpl } = require('./mailer_sendgrid');
// const { sendMail, sendMailUsingTmpl } = require('./mailer_smtp');
const { sendMail, sendMailUsingTmpl } = require('./mailer_mailersend');

module.exports = {
  sendMail,
  sendMailUsingTmpl,
};
