const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { consoleLog } = require('./logger');
const { aws: awsConfig, drivers } = require('../../config/providers');

let client;
function getClient() {
  if (!client) {
    client = new SQSClient({
      credentials: {
        accessKeyId: awsConfig.accessId,
        secretAccessKey: awsConfig.secretKey,
      },
      region: awsConfig.region,
    });
  }
  return client;
}

/**
 * Push queue_id to SQS (QUEUE_DRIVER=sqs).
 * With QUEUE_DRIVER=cron, pending tasks are picked up by the scheduled /v1/utils/run-cron-queue call.
 */
async function pushQueue({
  data = {},
  delay = 0,
  throwErr = false,
}) {
  if (drivers.queue !== 'sqs') {
    consoleLog(`Queue driver ${drivers.queue} - task left for scheduler`, data);
    return true;
  }

  try {
    // debug log
    consoleLog('Push to SQS queue');
    const response = await getClient().send(new SendMessageCommand({
      QueueUrl: awsConfig.sqsUrl,
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
  getClient,
  pushQueue,
};
