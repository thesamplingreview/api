const { getEnv } = require('./utils');

module.exports = {
  // service drivers (defaults keep the original AWS setup)
  drivers: {
    mail: getEnv(process.env.MAIL_DRIVER, 'mailersend'), // mailersend | resend | sendgrid
    sms: getEnv(process.env.SMS_DRIVER, 'aws'), // aws | none
    queue: getEnv(process.env.QUEUE_DRIVER, 'sqs'), // sqs | cron
  },

  // aws (or any S3-compatible storage, e.g. MinIO)
  aws: {
    accessId: getEnv(process.env.AWS_ACCESS_KEY_ID),
    secretKey: getEnv(process.env.AWS_SECRET_ACCESS_KEY),
    region: getEnv(process.env.AWS_DEFAULT_REGION),
    bucket: getEnv(process.env.AWS_BUCKET),
    sqsUrl: getEnv(process.env.AWS_SQS_URL),
    // S3-compatible endpoint, e.g. https://files.samplingreview.com
    endpoint: getEnv(process.env.AWS_ENDPOINT),
    forcePathStyle: getEnv(process.env.AWS_USE_PATH_STYLE_ENDPOINT, false),
    // public base url of the bucket (incl. bucket for path-style), e.g. https://files.samplingreview.com/samplingreview
    publicUrl: getEnv(process.env.AWS_URL),
  },

  // resend mailer
  resend: {
    apiKey: getEnv(process.env.RESEND_API_KEY),
    fromName: getEnv(process.env.MAIL_FROM_NAME),
    fromEmail: getEnv(process.env.MAIL_FROM_EMAIL),
  },

  // sendgrid mailer
  sendgrid: {
    apiKey: getEnv(process.env.SENDGRID_API_KEY),
    fromName: getEnv(process.env.MAIL_FROM_NAME),
    fromEmail: getEnv(process.env.MAIL_FROM_EMAIL),
  },

  // mailersend mailer
  mailersend: {
    apiToken: getEnv(process.env.MAILERSEND_API_TOKEN),
    fromName: getEnv(process.env.MAIL_FROM_NAME),
    fromEmail: getEnv(process.env.MAIL_FROM_EMAIL),
  },

  // twilio SMS
  twilio: {
    sid: getEnv(process.env.TWILIO_ACCOUNT_SID),
    verifySid: getEnv(process.env.TWILIO_VERIFY_SID),
    token: getEnv(process.env.TWILIO_TOKEN),
  },

  // whatsapp (Facebook/Meta WhatsApp Business API - commented out, using Evolution API)
  whatsapp: {
    numberId: getEnv(process.env.WHATSAPP_NUMBER_ID),
    token: getEnv(process.env.WHATSAPP_TOKEN),
  },

  // evolution api (WhatsApp via Evolution API)
  evolution: {
    apiUrl: getEnv(process.env.EVOLUTION_API_URL, 'https://evo-o2oengage.chattalyst.com'),
    apiKey: getEnv(process.env.EVOLUTION_API_KEY),
    instance: getEnv(process.env.EVOLUTION_INSTANCE, 'chattalyst'),
  },
};
