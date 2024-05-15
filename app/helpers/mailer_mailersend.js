const {
  MailerSend,
  EmailParams,
  Sender,
  Recipient,
} = require('mailersend');
const { mailersend: mailersendConfig } = require('../../config/providers');

const client = new MailerSend({
  apiKey: mailersendConfig.apiToken,
});

async function sendMail({
  to,
  from,
  fromName,
  subject,
  content,
  useHtml = false,
  throwErr = false,
}) {
  const sentFrom = new Sender(
    from || mailersendConfig.fromEmail,
    fromName || mailersendConfig.fromName,
  );
  const receivers = Array.isArray(to) ? to : [to];
  const sentTo = receivers.map((v) => new Recipient(v, v));

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(sentTo)
    .setSubject(subject);
  if (useHtml) {
    emailParams.setHtml(content);
  } else {
    emailParams.setText(content);
  }

  try {
    const response = await client.email.send(emailParams);
    return response.statusCode === 202;
  } catch (err) {
    console.log(err);
    if (throwErr) {
      const errMsg = err.body?.message;
      throw new Error(errMsg || 'Unknown response from MailersSend');
    }
    return false;
  }
}

async function sendMailUsingTmpl({
  to,
  from,
  fromName,
  subject,
  templateId,
  templateData,
  throwErr = false,
}) {
  const sentFrom = new Sender(
    from || mailersendConfig.fromEmail,
    fromName || mailersendConfig.fromName,
  );
  const receivers = Array.isArray(to) ? to : [to];
  const sentTo = receivers.map((v) => new Recipient(v, v));
  const personalization = receivers.map((v) => ({
    email: v,
    data: templateData,
  }));

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(sentTo)
    .setPersonalization(personalization)
    .setSubject(subject)
    .setTemplateId(templateId);

  try {
    const response = await client.email.send(emailParams);
    return response.statusCode === 202;
  } catch (err) {
    console.log(err);
    if (throwErr) {
      const errMsg = err.body?.message;
      throw new Error(errMsg || 'Unknown response from MailersSend');
    }
    return false;
  }
}

module.exports = {
  client,
  sendMail,
  sendMailUsingTmpl,
};
