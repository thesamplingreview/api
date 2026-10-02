// define which services will be using here (SMS_DRIVER)
const { drivers } = require('../../config/providers');
const { consoleLog } = require('./logger');

/**
 * SMS disabled - log and skip without failing callers (e.g. workflow tasks)
 */
async function sendDisabledSMS({ to }) {
  consoleLog(`SMS disabled (SMS_DRIVER=${drivers.sms}), skipped sending to ${to}`);
  return false;
}

const { sendSMS } = drivers.sms === 'aws'
  ? require('./sms_aws')
  : { sendSMS: sendDisabledSMS };

module.exports = {
  sendSMS,
};
