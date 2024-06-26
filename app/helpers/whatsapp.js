const { consoleLog } = require('./logger');
const { whatsapp: whatsappConfig } = require('../../config/providers');

/**
 * Due to WhatsApp policy, bussiness unable to initiate an business using 'text'
 * @ref: https://stackoverflow.com/a/72661353
 */
async function sendWhatsApp({
  to,
  message,
  throwErr = false,
}) {
  try {
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    };
    const endpoint = `https://graph.facebook.com/v19.0/${whatsappConfig.numberId}/messages`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${whatsappConfig.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    // console.log(result);
    if (result.error) {
      throw new Error(result.error.error_data?.details || result.error.message || 'Unknown WA error');
    }
    return true;
  } catch (err) {
    if (throwErr) {
      throw err;
    }
    // debug log
    consoleLog('Failed to send WhatsApp message...', err);
    return false;
  }
}

async function sendWhatsAppTmpl({
  to,
  templateName,
  input,
  inputOrder = [], // whatsapp params rely on orders
  language = 'en',
  throwErr = false,
}) {
  consoleLog('WhatsApp:', 'Send tmpl message to', to);
  try {
    const paramsOrder = inputOrder?.length ? inputOrder : Object.keys(input);
    const params = paramsOrder.map((key) => ({
      type: 'text',
      text: input[key] || '',
    })) || [];
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: language,
        },
        components: [
          {
            type: 'body',
            parameters: params,
          },
        ],
      },
    };
    const endpoint = `https://graph.facebook.com/v19.0/${whatsappConfig.numberId}/messages`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${whatsappConfig.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error.error_data?.details || result.error.message || 'Unknown WA error');
    }

    consoleLog('WhatsApp:', 'Send tmpl message to - end', to);
    return true;
  } catch (err) {
    consoleLog('WhatsAppErr:', 'Send tmpl message to', to, err.message);
    if (throwErr) {
      throw err;
    }
    return false;
  }
}

async function sendWhatsAppCode({
  to,
  code,
  templateName,
  language = 'en',
  throwErr = false,
}) {
  consoleLog('WhatsApp:', 'Send OTP message to', to);
  try {
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: language,
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: code },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [
              { type: 'text', text: code },
            ],
          },
        ],
      },
    };
    const endpoint = `https://graph.facebook.com/v19.0/${whatsappConfig.numberId}/messages`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${whatsappConfig.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    // console.log(result);
    if (result.error) {
      throw new Error(result.error.error_data?.details || result.error.message || 'Unknown WA error');
    }

    consoleLog('WhatsApp:', 'Send OTP message to - end', to);
    return true;
  } catch (err) {
    consoleLog('WhatsAppErr:', 'Send OTP message to', to, err.message);
    if (throwErr) {
      throw err;
    }
    return false;
  }
}

module.exports = {
  sendWhatsApp,
  sendWhatsAppCode,
  sendWhatsAppTmpl,
};
