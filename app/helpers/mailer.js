// define which services will be using here (MAIL_DRIVER)
const { drivers } = require('../../config/providers');

const mailers = {
  mailersend: () => require('./mailer_mailersend'),
  resend: () => require('./mailer_resend'),
  sendgrid: () => require('./mailer_sendgrid'),
};
const { sendMail, sendMailUsingTmpl } = (mailers[drivers.mail] || mailers.mailersend)();

module.exports = {
  sendMail,
  sendMailUsingTmpl,
};
