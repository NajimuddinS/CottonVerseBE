const twilio = require('twilio');
const ErrorResponse = require('../utils/errorResponse');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const sendSMS = async options => {
  try {
    await client.messages.create({
      body: options.message,
      from: fromNumber,
      to: `+91${options.mobile}` // Indian numbers
    });
  } catch (error) {
    throw new ErrorResponse('SMS could not be sent', 500);
  }
};

module.exports = sendSMS;