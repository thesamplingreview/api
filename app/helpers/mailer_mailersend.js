const {
  MailerSend,
  EmailParams,
  Sender,
  Recipient,
} = require('mailersend');
const { consoleLog } = require('./logger');
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
  consoleLog('Mailer:', 'Sending email to', to);
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

    consoleLog('Mailer:', `Sending email to (code ${response?.statusCode}) - end`, to);
    return response?.statusCode === 202;
  } catch (err) {
    const errMsg = err.body?.message || 'Unknown response from MailersSend';
    consoleLog('MailerErr:', 'Sending email to', to, errMsg);
    if (throwErr) {
      throw new Error(errMsg);
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
  consoleLog('Mailer:', 'Sending tmpl email to', to, templateId);
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

    consoleLog('Mailer:', `Sending tmpl email to - done (status ${response?.statusCode})`, to, templateId);
    return response?.statusCode === 202;
  } catch (err) {
    const errMsg = err.body?.message || 'Unknown response from MailersSend';
    consoleLog('Mailer:Err', 'Sending tmpl email to', to, templateId, errMsg);
    if (throwErr) {
      throw new Error(errMsg);
    }
    return false;
  }
}

module.exports = {
  client,
  sendMail,
  sendMailUsingTmpl,
};
