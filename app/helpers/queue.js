const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { consoleLog } = require('./logger');
const { aws: awsConfig } = require('../../config/providers');

const client = new SQSClient({
  credentials: {
    accessKeyId: awsConfig.accessId,
    secretAccessKey: awsConfig.secretKey,
  },
  region: awsConfig.region,
});

/**
 * SMS service was relying on AWS SNS service
 */
async function pushQueue({
  data = {},
  delay = 0,
  throwErr = false,
}) {
  try {
    // debug log
    consoleLog('Push to SQS queue');
    const response = await client.send(new SendMessageCommand({
      QueueUrl: 'https://sqs.ap-southeast-1.amazonaws.com/029060303898/MyTestQueue',
      MessageBody: JSON.stringify(data),
      DelaySeconds: delay,
    }));
    consoleLog('End SQS queue push', response.MessageId);
    return Boolean(response?.MessageId);
  } catch (err) {
    if (throwErr) {
      throw err;
    }
    // debug log
    consoleLog('Failed push to SQS queue...', err);
    return false;
  }
}

module.exports = {
  client,
  pushQueue,
};
