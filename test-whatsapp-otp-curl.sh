#!/bin/bash

# Test script to send OTP via Evolution API using curl
# Usage: bash test-whatsapp-otp-curl.sh

EVOLUTION_API_URL="https://evo-o2oengage.chattalyst.com"
EVOLUTION_API_KEY="429683C4C977415CAAFCCE10F7D57E11"
EVOLUTION_INSTANCE="2167E52E521F-43DC-A39D-A88198465172"
PHONE_NUMBER="60175168607"
OTP_CODE="123456"  # Change this to your desired OTP code

MESSAGE="Your [SamplingReview] verification code is: ${OTP_CODE}"

echo "💬 WhatsApp OTP Test via Evolution API (curl)"
echo "=============================================="
echo "API URL: ${EVOLUTION_API_URL}"
echo "Instance: ${EVOLUTION_INSTANCE}"
echo "Phone: ${PHONE_NUMBER}"
echo "OTP Code: ${OTP_CODE}"
echo ""

curl --request POST \
  --url "${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}" \
  --header 'Content-Type: application/json' \
  --header "apikey: ${EVOLUTION_API_KEY}" \
  --data "{
    \"number\": \"${PHONE_NUMBER}\",
    \"text\": \"${MESSAGE}\",
    \"delay\": 200,
    \"linkPreview\": false
  }"

echo ""
echo ""
echo "✅ Request sent!"
