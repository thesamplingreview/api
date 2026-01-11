@echo off
REM Test script to send OTP via Evolution API using curl (Windows)
REM Usage: test-whatsapp-otp-curl.bat

set EVOLUTION_API_URL=https://evo-o2oengage.chattalyst.com
set EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
set EVOLUTION_INSTANCE=2167E52E521F-43DC-A39D-A88198465172
set PHONE_NUMBER=60175168607
set OTP_CODE=123456

set MESSAGE=Your [SamplingReview] verification code is: %OTP_CODE%

echo 💬 WhatsApp OTP Test via Evolution API (curl)
echo ==============================================
echo API URL: %EVOLUTION_API_URL%
echo Instance: %EVOLUTION_INSTANCE%
echo Phone: %PHONE_NUMBER%
echo OTP Code: %OTP_CODE%
echo.

curl --request POST ^
  --url "%EVOLUTION_API_URL%/message/sendText/%EVOLUTION_INSTANCE%" ^
  --header "Content-Type: application/json" ^
  --header "apikey: %EVOLUTION_API_KEY%" ^
  --data "{\"number\": \"%PHONE_NUMBER%\", \"text\": \"%MESSAGE%\", \"delay\": 200, \"linkPreview\": false}"

echo.
echo.
echo ✅ Request sent!
