// define which services will be using here
// const { sendSMS } = require('./sms_twilio');
const { sendSMS } = require('./sms_aws');

module.exports = {
  sendSMS,
};
