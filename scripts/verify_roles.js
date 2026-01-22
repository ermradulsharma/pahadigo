const BASE_URL = 'http://localhost:3000/api';

async function testRoles() {
  const timestamp = Date.now();

  // --- 1. Traveller Flow ---
  console.log('\n=== 1. Traveller Flow ===');
  const travellerEmail = `traveller_${timestamp}@test.com`;

  // A. Send OTP
  console.log('Sending OTP for Traveller...');
  let res = await fetch(`${BASE_URL}/auth/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: travellerEmail, role: 'user' })
  });
  if (!res.ok) { let t = await res.text(); console.error('T-OTP Failed:', res.status, t); return; }
  let data = await res.json();
  const otp = data.dev_otp;

  // B. Verify & Signup (Default Role)
  console.log('Verifying Traveller Signup (No Role param)...');
  res = await fetch(`${BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: travellerEmail, otp })
  });
  if (!res.ok) { let t = await res.text(); console.error('T-Signup Failed:', res.status, t); return; }
  data = await res.json();
  console.log(`Traveller Signup: Status ${res.status}, Role: ${data.role}, IsNew: ${data.isNewUser}`);

  if (data.role !== 'user') console.error('FAILED: Role should be user');

  // C. Login Again
  // Request New OTP
  console.log('Requesting new OTP for Traveller Login...');
  res = await fetch(`${BASE_URL}/auth/otp`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: travellerEmail })
  });
  data = await res.json();
  const loginOtpT = data.dev_otp;

  console.log('Verifying Traveller Login...');
  res = await fetch(`${BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: travellerEmail, otp: loginOtpT })
  });
  if (!res.ok) { let t = await res.text(); console.error('T-Login Failed:', res.status, t); return; }
  data = await res.json();
  console.log(`Traveller Login: Status ${res.status}, IsNew: ${data.isNewUser}`);

  if (data.isNewUser !== false) console.error('FAILED: Traveller should be existing user');


  // --- 2. Vendor Flow ---
  console.log('\n=== 2. Vendor Flow ===');
  const vendorEmail = `vendor_${timestamp}@test.com`;

  // A. Send OTP
  console.log('Sending OTP for Vendor...');
  res = await fetch(`${BASE_URL}/auth/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: vendorEmail, role: 'vendor' })
  });
  if (!res.ok) { let t = await res.text(); console.error('V-OTP Failed:', res.status, t); return; }
  data = await res.json();
  const vendorOtp = data.dev_otp;

  // B. Verify & Signup (Roles remembered from OTP)
  console.log('Verifying Vendor Signup (role: vendor implied)...');
  res = await fetch(`${BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: vendorEmail, otp: vendorOtp })
  });
  if (!res.ok) { let t = await res.text(); console.error('V-Signup Failed:', res.status, t); return; }
  data = await res.json();
  const vendorToken = data.token;
  console.log(`Vendor Signup: Status ${res.status}, Role: ${data.role}, IsNew: ${data.isNewUser}`);

  if (data.role !== 'vendor') console.error('FAILED: Role should be vendor');

  // C. Login Again (No Profile)
  // Request New OTP
  console.log('Requesting new OTP for Vendor Login...');
  res = await fetch(`${BASE_URL}/auth/otp`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: vendorEmail })
  });
  data = await res.json();
  const loginOtpV1 = data.dev_otp;

  console.log('Verifying Vendor Login (No Profile)...');
  res = await fetch(`${BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: vendorEmail, otp: loginOtpV1 })
  });
  if (!res.ok) { let t = await res.text(); console.error('V-LoginNoProf Failed:', res.status, t); return; }
  data = await res.json();
  console.log(`Vendor Login (No Profile): IsNew: ${data.isNewUser}`);

  if (data.isNewUser !== true) console.error('FAILED: Vendor without profile should be treated as new');

  // D. Create Profile
  console.log('Creating Vendor Profile...');
  res = await fetch(`${BASE_URL}/vendor/profile`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${vendorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: 'Test Biz',
      category: ['Hotel'],
      address: 'Test Addr'
    })
  });
  if (!res.ok) { let t = await res.text(); console.error('Profile Create Failed:', res.status, t); return; }
  console.log('Profile Create Status:', res.status);

  // E. Login Again (With Profile)
  // Request New OTP
  console.log('Requesting new OTP for Vendor Login (With Profile)...');
  res = await fetch(`${BASE_URL}/auth/otp`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: vendorEmail })
  });
  data = await res.json();
  const loginOtpV2 = data.dev_otp;

  console.log('Verifying Vendor Login (With Profile)...');
  res = await fetch(`${BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: vendorEmail, otp: loginOtpV2 })
  });
  if (!res.ok) { let t = await res.text(); console.error('V-LoginWithProf Failed:', res.status, t); return; }
  data = await res.json();
  console.log(`Vendor Login (With Profile): IsNew: ${data.isNewUser}`);

  if (data.isNewUser !== false) console.error('FAILED: Vendor with profile should be existing');

}

testRoles().catch(console.error);
