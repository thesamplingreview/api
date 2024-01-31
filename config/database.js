const { getEnv } = require('./utils');

module.exports = {
  db: {
    host: getEnv(process.env.DB_HOST),
    username: getEnv(process.env.DB_USERNAME),
    password: getEnv(process.env.DB_PASSWORD),
    database: getEnv(process.env.DB_DATABASE),
    connectTimeout: 60000,
  },
};
