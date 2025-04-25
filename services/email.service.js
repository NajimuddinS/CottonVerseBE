const nodemailer = require('nodemailer');
const ErrorResponse = require('../utils/errorResponse');

const sendEmail = async options => {
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  // Define email options
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // Send email
  try {
    await transporter.sendMail(message);
  } catch (error) {
    throw new ErrorResponse('Email could not be sent', 500);
  }
};

module.exports = sendEmail;