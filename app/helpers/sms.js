const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
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
    return false;
  }
}

module.exports = {
  client,
  sendSMS,
};
