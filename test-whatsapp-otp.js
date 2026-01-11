/**
 * Test script to send OTP via Evolution API (WhatsApp)
 * Usage: 
 *   node test-whatsapp-otp.js --contact +1234567890
 *   node test-whatsapp-otp.js --contact +1234567890 --token YOUR_OTP_CODE
 */

require('dotenv').config();
const VerificationService = require('./app/services/VerificationService');
// const { sendWhatsAppCode } = require('./app/helpers/whatsapp'); // Commented out - using Evolution API instead

// Evolution API configuration
const EVOLUTION_API_URL = 'https://evo-o2oengage.chattalyst.com';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
// Evolution API uses instance name, not UUID
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'chattalyst';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    contact: null,
    token: null, // optional: if provided, will use this token instead of generating new one
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    
    if (key === 'contact') {
      options.contact = value;
    } else if (key === 'token') {
      options.token = value;
    }
  }

  return options;
}

async function testWhatsAppOtp() {
  const options = parseArgs();
  
  // Validate inputs
  if (!options.contact) {
    console.error('❌ Error: --contact is required');
    console.log('\nUsage:');
    console.log('  node test-whatsapp-otp.js --contact +1234567890');
    console.log('  node test-whatsapp-otp.js --contact +1234567890 --token 123456');
    console.log('\nNote: Phone number should include country code (e.g., +1234567890)');
    process.exit(1);
  }

  console.log('\n💬 WhatsApp OTP Test Script');
  console.log('============================');
  console.log(`Contact: ${options.contact}`);
  console.log('');

  let result;
  try {
    let otpCode;
    let verificationToken;

    if (options.token) {
      // Use provided token
      otpCode = options.token;
      console.log(`🔑 Using provided OTP token: ${otpCode}`);
      
      // Still need to create verification token record
      const verificationService = new VerificationService();
      verificationToken = await verificationService.createOtpToken({
        contact: options.contact,
      });
      verificationToken.token = otpCode;
      await verificationToken.save();
    } else {
      // Generate new OTP using VerificationService
      console.log('📤 Generating OTP and sending via WhatsApp...');
      const verificationService = new VerificationService();
      verificationToken = await verificationService.sendOtpWa({
        contact: options.contact,
      });
      otpCode = verificationToken.token;
    }

    // Send via Evolution API
    console.log('\n📤 Sending OTP via Evolution API...');
    console.log(`   API URL: ${EVOLUTION_API_URL}`);
    console.log(`   Instance: ${EVOLUTION_INSTANCE}`);
    console.log(`   Code: ${otpCode}`);
    
    // Format phone number (remove + if present, Evolution API expects numbers without +)
    const phoneNumber = options.contact.replace(/^\+/, '');
    const message = `Your [SamplingReview] verification code is: ${otpCode}`;
    
    // Send via Evolution API
    const evolutionEndpoint = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`;
    const response = await fetch(evolutionEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: message,
        delay: 200,
        linkPreview: false,
      }),
    });

    result = await response.json();

    if (response.ok && result) {
      console.log('\n✅ WhatsApp OTP sent successfully via Evolution API!');
      console.log(`🔑 OTP Code: ${otpCode}`);
      console.log(`💬 Check your WhatsApp: ${options.contact}`);
      console.log(`📨 Message ID: ${result.key || result.messageId || 'N/A'}`);
      
      console.log('\n📋 Verification Token Details:');
      console.log(`   Token ID: ${verificationToken.id}`);
      console.log(`   Token Value: ${verificationToken.token_value}`);
      console.log(`   Type: ${verificationToken.type}`);
      console.log(`   Created At: ${verificationToken.created_at}`);
      console.log(`   Expires At: ${verificationToken.expired_at}`);
      console.log(`   Expires In: ${Math.round((new Date(verificationToken.expired_at) - new Date()) / 1000 / 60)} minutes`);
      
      console.log('\n✅ Test completed successfully!');
      process.exit(0);
    } else {
      const errorMsg = result?.message || result?.error || 'Unknown error from Evolution API';
      throw new Error(`Evolution API error: ${errorMsg} (Status: ${response.status})`);
    }
  } catch (err) {
    console.error('\n❌ Error sending WhatsApp OTP:', err.message);
    if (err.stack) {
      console.error('\nStack trace:');
      console.error(err.stack);
    }
    console.error('\n💡 Troubleshooting:');
    console.error('   - Check if Evolution API credentials are configured in .env (EVOLUTION_API_KEY, EVOLUTION_INSTANCE)');
    console.error('   - Verify the phone number format includes country code (e.g., +1234567890)');
    console.error('   - Ensure the Evolution API instance is connected and active');
    console.error('   - Check if the recipient phone number is registered with WhatsApp');
    if (result) {
      console.error(`   - API Response: ${JSON.stringify(result, null, 2)}`);
    }
    process.exit(1);
  }
}

// Run the test
testWhatsAppOtp();
