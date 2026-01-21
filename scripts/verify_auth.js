const BASE_URL = 'http://localhost:3001/api';

async function testAuthFlow() {
  const timestamp = Date.now();
  const phone = `+91${timestamp.toString().slice(-10)}`;
  const email = `user_${timestamp}@example.com`;
  const password = 'SecretPassword123!';

  console.log(`Test User: ${email} / ${phone}`);

  console.log('\n--- 1. Testing Registration with Password (Email Auth) ---');
  const registerRes = await fetch(`${BASE_URL}/vendor/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, phone, password })
  });
  
  const registerData = await registerRes.json();
  console.log('Reg Status:', registerRes.status);
  
  if (registerRes.status === 201 && registerData.token) {
      console.log('SUCCESS: Direct Signup worked. Token received.');
  } else {
      console.error('FAILED: Registration response:', registerData);
  }

  console.log('\n--- 2. Testing Login with Password ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status);
  
  if (loginRes.status === 200 && loginData.token) {
      console.log('SUCCESS: Login worked. Token received.');
  } else {
      console.error('FAILED: Login response:', loginData);
  }

  console.log('\n--- 3. Testing Login with WRONG Password ---');
  const failRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'WrongPassword' })
  });
  console.log('Fail Status:', failRes.status);
  if (failRes.status === 401) {
      console.log('SUCCESS: Verification failed as expected.');
  } else {
      console.error('FAILED: Should have returned 401. Got:', failRes.status);
  }

  // Note: Cannot verify Google Auth automatically without a real ID Token.
  console.log('\n--- Google Auth check skipped (requires real ID Token) ---');
}

testAuthFlow().catch(console.error);
