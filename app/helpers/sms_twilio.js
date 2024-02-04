const twilio = require('twilio');
const { twilio: twilioConfig } = require('../../config/providers');

const client = twilio(twilioConfig.sid, twilioConfig.token);

/**
 * OTP service was relying on Twilio service
 */
async function sendOTP({ to }) {
  try {
    const response = await client.verify.v2.services(twilioConfig.verifySid)
      .verifications
      .create({
        to,
        channel: 'sms',
      });
    console.log(response);
    return Boolean(response?.sid);
  } catch (err) {
    console.log(err);
    return false;
  }
}

async function verifyOTP({ to, code }) {
  try {
    const response = await client.verify.v2.services(twilioConfig.verifySid)
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
