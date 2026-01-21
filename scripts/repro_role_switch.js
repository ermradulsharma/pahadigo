const BASE_URL = 'http://localhost:3001/api';

async function testRoleSwitch() {
  const timestamp = Date.now();
  const email = `switch_test_${timestamp}@test.com`;
  
  console.log(`Testing with email: ${email}`);

  // 1. Signup as Traveller
  console.log('\n--- 1. Signup as Traveller ---');
  // Send OTP
  let res = await fetch(`${BASE_URL}/auth/otp`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
  });
  let data = await res.json();
  const otp1 = data.dev_otp;

  // Verify (Default Role = User)
  res = await fetch(`${BASE_URL}/auth/verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp: otp1 })
  });
  data = await res.json();
  console.log(`Traveller Signup: Role=${data.role}, IsNew=${data.isNewUser}`); // Expect 'user', true

  // 2. Try to Login/Signup as Vendor using SAME email
  console.log('\n--- 2. Attempt Vendor Signup (Same Email) ---');
  // Send OTP (New OTP)
  res = await fetch(`${BASE_URL}/auth/otp`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
  });
  data = await res.json();
  const otp2 = data.dev_otp;

  // Verify with role = 'vendor'
  res = await fetch(`${BASE_URL}/auth/verify`, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ email, otp: otp2, role: 'vendor' })
  });
  data = await res.json();
  console.log(`Vendor Attempt: Role=${data.role}, IsNew=${data.isNewUser}`); 
  
  if (data.role === 'user') {
      console.log('FAIL: User remained as Traveller despite requesting Vendor role.');
  } else if (data.role === 'vendor') {
      console.log('SUCCESS: User successfully switched/upgraded to Vendor.');
  }
}

testRoleSwitch().catch(console.error);
