const twilio = require('twilio');

const sendSMS = async (options) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  await client.messages.create({
    body: options.body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: options.to
  });
};

module.exports = sendSMS;