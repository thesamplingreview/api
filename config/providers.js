const { getEnv } = require('./utils');

module.exports = {
  // aws
  aws: {
    accessId: getEnv(process.env.AWS_ACCESS_KEY_ID),
    secretKey: getEnv(process.env.AWS_SECRET_ACCESS_KEY),
    region: getEnv(process.env.AWS_DEFAULT_REGION),
    bucket: getEnv(process.env.AWS_BUCKET),
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

  // whatsapp
  whatsapp: {
    numberId: getEnv(process.env.WHATSAPP_NUMBER_ID),
    token: getEnv(process.env.WHATSAPP_TOKEN),
  },
};
