const client = require('@sendgrid/mail');
const { sendgrid } = require('../../config/providers');

client.setApiKey(sendgrid.apiKey);

async function sendMail({
  to,
  toName,
  from,
  fromName,
  subject,
  content,
  useHtml = false,
}) {
  const message = {
    personalizations: [
      {
        to: [
          {
            email: to,
            name: toName || to,
          },
        ],
        subject,
      },
    ],
    from: {
      email: from || sendgrid.fromEmail,
      name: fromName || sendgrid.fromName,
    },
    subject,
    content: [
      {
        type: useHtml ? 'text/html' : 'text/plain',
        value: content,
      },
    ],
  };

  try {
    const sent = await client.send(message);
    // console.log(sent);
    return sent?.[0]?.statusCode === 202;
  } catch (err) {
    console.log(err);
    return false;
  }
}

async function sendMailUsingSendgridTmpl({
  to,
  toName,
  from,
  fromName,
  subject,
  templateId,
  templateData,
}) {
  const message = {
    personalizations: [
      {
        to: [
          {
            email: to,
            name: toName || to,
          },
        ],
        subject,
        dynamic_template_data: templateData,
      },
    ],
    from: {
      email: from || sendgrid.fromEmail,
      name: fromName || sendgrid.fromName,
    },
    subject,
    content: [],
    template_id: templateId,
  };

  try {
    const sent = await client.send(message);
    // console.log(sent);
    return sent?.[0]?.statusCode === 202;
  } catch (err) {
    console.log(err);
    return false;
  }
}

module.exports = {
  client,
  sendMail,
  sendMailUsingSendgridTmpl,
};
