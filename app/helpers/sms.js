const { twilio } = require('../../config/providers');
const client = require('twilio')(twilio.sid, twilio.token);

/**
 * OTP service was relying on Twilio service
 */
async function sendOTP({ to }) {
  try {
    const response = await client.verify.v2.services(twilio.verifySid)
      .verifications
      .create({
        to,
        channel: 'sms',
      });

    return Boolean(response?.sid);
  } catch (err) {
    return false;
  }
}

async function verifyOTP({ to, code }) {
  try {
    const response = await client.verify.v2.services(twilio.verifySid)
      .verificationChecks
      .create({
        to,
        code,
      });
    return Boolean(response.status);
  } catch (err) {
    return false;
  }
}

module.exports = {
  client,
  sendOTP,
  verifyOTP,
};
