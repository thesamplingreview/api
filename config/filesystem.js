const { getEnv } = require('../app/helpers/utils');

module.exports = {
  s3: {
    accessId: getEnv(process.env.AWS_ACCESS_KEY_ID),
    secretKey: getEnv(process.env.AWS_SECRET_ACCESS_KEY),
    region: getEnv(process.env.AWS_DEFAULT_REGION),
    bucket: getEnv(process.env.AWS_BUCKET),
  },
};
