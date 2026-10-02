const { consoleLog } = require('./logger');
const { resend: resendConfig } = require('../../config/providers');

const endpoint = 'https://api.resend.com/emails';

function formatSender(email, name) {
  return name ? `${name} <${email}>` : email;
}

async function send(payload) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.message || `Unknown response from Resend (status ${response.status})`);
  }
  return result;
}

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
  try {
    const result = await send({
      from: formatSender(from || resendConfig.fromEmail, fromName || resendConfig.fromName),
      to: Array.isArray(to) ? to : [to],
      subject,
      [useHtml ? 'html' : 'text']: content,
    });

    consoleLog('Mailer:', `Sending email to (id ${result?.id}) - end`, to);
    return Boolean(result?.id);
  } catch (err) {
    consoleLog('MailerErr:', 'Sending email to', to, err.message);
    if (throwErr) {
      throw err;
    }
    return false;
  }
}

/**
 * Resend template variables only accept string/number values
 */
function toTemplateVariables(data = {}) {
  return Object.fromEntries(
    Object.entries(data || {}).map(([key, val]) => [
      key,
      typeof val === 'number' ? val : String(val ?? ''),
    ]),
  );
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
  try {
    const result = await send({
      from: formatSender(from || resendConfig.fromEmail, fromName || resendConfig.fromName),
      to: Array.isArray(to) ? to : [to],
      subject,
      template: {
        id: templateId,
        variables: toTemplateVariables(templateData),
      },
    });

    consoleLog('Mailer:', `Sending tmpl email to - done (id ${result?.id})`, to, templateId);
    return Boolean(result?.id);
  } catch (err) {
    consoleLog('Mailer:Err', 'Sending tmpl email to', to, templateId, err.message);
    if (throwErr) {
      throw err;
    }
    return false;
  }
}

module.exports = {
  sendMail,
  sendMailUsingTmpl,
};
