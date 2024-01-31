const { getEnv } = require('./utils');

module.exports = {
  host: getEnv(process.env.MAIL_HOST),
  port: getEnv(process.env.MAIL_PORT),
  username: getEnv(process.env.MAIL_USERNAME),
  password: getEnv(process.env.MAIL_PASSWORD),
  fromName: getEnv(process.env.MAIL_FROM_NAME),
  fromEmail: getEnv(process.env.MAIL_FROM_EMAIL),
};
