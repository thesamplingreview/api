const nodemailer = require('nodemailer');
const mailConfig = require('../../config/mail');

const transporter = nodemailer.createTransport({
  host: mailConfig.host,
  port: mailConfig.port,
  auth: {
    user: mailConfig.username,
    pass: mailConfig.password,
  },
});

async function sendMail({
  to,
  from,
  fromName,
  subject,
  content,
  useHtml = false,
}) {
  const mailOptions = {
    to,
    from: `${fromName || mailConfig.fromName} <${from || mailConfig.fromEmail}>`,
    subject,
  };
  if (useHtml) {
    mailOptions.html = content;
  } else {
    mailOptions.text = content;
  }

  const info = await transporter.sendMail(mailOptions);
  return info?.messageId || false;
}

module.exports = {
  transporter,
  sendMail,
};
