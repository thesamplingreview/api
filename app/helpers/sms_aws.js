const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { consoleLog } = require('./logger');
const { aws: awsConfig } = require('../../config/providers');

const client = new SNSClient({
  credentials: {
    accessKeyId: awsConfig.accessId,
    secretAccessKey: awsConfig.secretKey,
  },
  region: awsConfig.region,
});

/**
 * SMS service was relying on AWS SNS service
 */
async function sendSMS({
  to,
  message,
  throwErr = false,
}) {
  try {
    // debug log
    consoleLog(`Send SMS to ${to}...`);
    const response = await client.send(
      new PublishCommand({
        PhoneNumber: to,
        Message: message,
      }),
    );
    return Boolean(response?.MessageId);
  } catch (err) {
    if (throwErr) {
      throw err;
    }
    // debug log
    consoleLog('Failed to send SMS...', err);
    return false;
  }
}

module.exports = {
  client,
  sendSMS,
};
