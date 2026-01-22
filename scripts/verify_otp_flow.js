const BASE_URL = 'http://localhost:3000/api';

async function testOtpFlow() {
  const timestamp = Date.now();
  const email = `otp_user_${timestamp}@example.com`;
  const phone = `+91${timestamp.toString().slice(-10)}`;

  console.log(`Test User: ${email} / ${phone}`);

  // --- 1. Email Signup ---
  console.log('\n--- 1. Email Signup (OTP Request) ---');
  const emailOtpRes = await fetch(`${BASE_URL}/auth/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const emailOtpData = await emailOtpRes.json();
  console.log('Email OTP Status:', emailOtpRes.status);

  if (emailOtpRes.status !== 200) throw new Error('Email OTP failed');
  const emailCode = emailOtpData.dev_otp;
  console.log('Got Email OTP:', emailCode);

  console.log('--- 2. Verify Email OTP ---');
  const verifyEmailRes = await fetch(`${BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp: emailCode })
  });
  const verifyEmailData = await verifyEmailRes.json();
  console.log('Verify Status:', verifyEmailRes.status, 'IsNewUser:', verifyEmailData.isNewUser);

  // --- 2. Phone Signup ---
  console.log('\n--- 3. Phone Signup (OTP Request) ---');
  const phoneOtpRes = await fetch(`${BASE_URL}/auth/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  const phoneOtpData = await phoneOtpRes.json();
  console.log('Phone OTP Status:', phoneOtpRes.status);

  if (phoneOtpRes.status !== 200) throw new Error('Phone OTP failed');
  const phoneCode = phoneOtpData.dev_otp;
  console.log('Got Phone OTP:', phoneCode);

  console.log('--- 4. Verify Phone OTP ---');
  const verifyPhoneRes = await fetch(`${BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp: phoneCode })
  });
  const verifyPhoneData = await verifyPhoneRes.json();
  console.log('Verify Status:', verifyPhoneRes.status, 'IsNewUser:', verifyPhoneData.isNewUser);

  // --- 3. Login (Existing Email) ---
  console.log('\n--- 5. Login Existing Email (OTP Request) ---');
  const loginOtpRes = await fetch(`${BASE_URL}/auth/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const loginOtpData = await loginOtpRes.json();
  const loginCode = loginOtpData.dev_otp;

  console.log('--- 6. Verify Login OTP ---');
  const verifyLoginRes = await fetch(`${BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp: loginCode })
  });
  const verifyLoginData = await verifyLoginRes.json();
  console.log('Login Verify Status:', verifyLoginRes.status, 'IsNewUser:', verifyLoginData.isNewUser);

  if (verifyLoginData.isNewUser === false) {
    console.log('SUCCESS: Correctly identified existing user.');
  } else {
    console.error('FAILED: Should detect existing user.');
  }
}

testOtpFlow().catch(console.error);
