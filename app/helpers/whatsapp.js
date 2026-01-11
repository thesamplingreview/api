const { consoleLog } = require('./logger');
const { whatsapp: whatsappConfig, evolution: evolutionConfig } = require('../../config/providers');

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
  try {
    // Validate Evolution API configuration
    if (!evolutionConfig.apiUrl) {
      throw new Error('Evolution API URL is not configured. Please set EVOLUTION_API_URL environment variable.');
    }
    if (!evolutionConfig.apiKey) {
      throw new Error('Evolution API Key is not configured. Please set EVOLUTION_API_KEY environment variable.');
    }
    if (!evolutionConfig.instance) {
      throw new Error('Evolution API Instance is not configured. Please set EVOLUTION_INSTANCE environment variable.');
    }

    // Format phone number: remove +, handle duplicate country codes
    // Example: +6060175168607 -> 60175168607 (remove duplicate 60)
    let phoneNumber = to.replace(/^\+/, '');
    
    // Remove duplicate country code if present (e.g., 6060... -> 60...)
    // Common country codes: 60 (Malaysia), 62 (Indonesia), 65 (Singapore), etc.
    // Check if number starts with duplicate country code pattern (e.g., 6060, 6262, 6565)
    const duplicatePattern = /^(\d{2})\1/;
    if (duplicatePattern.test(phoneNumber)) {
      phoneNumber = phoneNumber.replace(/^(\d{2})/, '');
    }
    
    const endpoint = `${evolutionConfig.apiUrl}/message/sendText/${evolutionConfig.instance}`;
    
    // Send first message: instruction
    const firstMessage = 'Your [SamplingReview] verification code is:';
    const firstResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionConfig.apiKey,
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: firstMessage,
        delay: 200,
        linkPreview: false,
      }),
    });

    const firstResult = await firstResponse.json();
    if (!firstResponse.ok) {
      const errorMsg = firstResult?.message || firstResult?.error || 'Unknown error from Evolution API';
      throw new Error(`Evolution API error: ${errorMsg} (Status: ${firstResponse.status})`);
    }

    // Wait a bit before sending the code
    await new Promise(resolve => setTimeout(resolve, 500));

    // Send second message: just the code (easier to copy)
    const secondResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionConfig.apiKey,
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: code,
        delay: 200,
        linkPreview: false,
      }),
    });

    const secondResult = await secondResponse.json();
    if (!secondResponse.ok) {
      const errorMsg = secondResult?.message || secondResult?.error || 'Unknown error from Evolution API';
      throw new Error(`Evolution API error: ${errorMsg} (Status: ${secondResponse.status})`);
    }

    consoleLog('WhatsApp OTP sent');
    return true;
  } catch (err) {
    consoleLog('WhatsAppErr:', 'Failed to send OTP:', err.message);
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
