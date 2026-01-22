const BASE_URL = 'http://localhost:3000/api';

async function debugNullRole() {
  const email = `null_role_${Date.now()}@test.com`;
  console.log('Testing Send OTP WITHOUT role params:', email);

  // 1. Send OTP (No Role)
  let res = await fetch(`${BASE_URL}/auth/otp`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
  });
  let data = await res.json();
  const otp = data.dev_otp;
  console.log('OTP:', otp);

  // 2. Verify
  res = await fetch(`${BASE_URL}/auth/verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp })
  });
  console.log('Verifying...');
  const text = await res.text();
  console.log('Response:', res.status, text);

  try {
    const json = JSON.parse(text);
    if (res.status === 200 && json.role === 'user') {
      console.log('SUCCESS: Defaulted to User role correctly.');
    } else {
      console.log('FAILURE: Did not default to User role.');
    }
  } catch (e) { console.log('FAILURE: Invalid JSON'); }
}

debugNullRole().catch(console.error);
