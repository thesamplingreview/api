const { getEnv } = require('./utils');

module.exports = {
  // s3 storage
  s3: {
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

  // twilio SMS
  twilio: {
    sid: getEnv(process.env.TWILIO_ACCOUNT_SID),
    verifySid: getEnv(process.env.TWILIO_VERIFY_SID),
    token: getEnv(process.env.TWILIO_TOKEN),
  },
};
