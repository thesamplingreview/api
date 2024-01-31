const client = require('@sendgrid/mail');
const { sendgrid } = require('../../config/providers');

client.setApiKey(sendgrid.apiKey);

async function sendMail({
  to,
  from,
  fromName,
  subject,
  content,
  useHtml = false,
  throwErr = false,
}) {
  const receivers = Array.isArray(to) ? to : [to];
  const message = {
    personalizations: [
      {
        to: receivers.map((v) => ({
          email: v,
          name: v,
        })),
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
    const error = err?.response?.body?.errors?.[0];
    console.log(err, error);
    if (throwErr) {
      throw new Error(error?.message || 'Unknown response from Sendgrid');
    }
    return false;
  }
}

async function sendMailUsingSendgridTmpl({
  to,
  from,
  fromName,
  subject,
  templateId,
  templateData,
  throwErr = false,
}) {
  const receivers = Array.isArray(to) ? to : [to];
  const message = {
    personalizations: [
      {
        to: receivers.map((v) => ({
          email: v,
          name: v,
        })),
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
    return sent?.[0]?.statusCode === 202;
  } catch (err) {
    const error = err?.response?.body?.errors?.[0];
    console.log(err, error);
    if (throwErr) {
      throw new Error(error?.message || 'Unknown response from Sendgrid');
    }
    return false;
  }
}

module.exports = {
  client,
  sendMail,
  sendMailUsingSendgridTmpl,
};
