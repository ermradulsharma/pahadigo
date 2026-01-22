const BASE_URL = 'http://localhost:3000/api';

async function testVendorFlow() {
  const timestamp = Date.now();
  const phone = `+919876543210`;
  const email = `vendor_${timestamp}@example.com`;

  console.log('--- 1. Testing Vendor Registration (OTP Request) ---');
  const registerRes = await fetch(`${BASE_URL}/vendor/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, phone })
  });

  const registerData = await registerRes.json();
  console.log('Status:', registerRes.status);
  console.log('Response:', registerData);

  if (registerRes.status !== 200) throw new Error('Registration failed');
  const otp = registerData.dev_otp;
  console.log('Got OTP:', otp);

  console.log('\n--- 2. Testing OTP Verification ---');
  const verifyRes = await fetch(`${BASE_URL}/vendor/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, phone, otp })
  });

  const verifyData = await verifyRes.json();
  console.log('Status:', verifyRes.status);
  console.log('Response:', verifyData);

  if (verifyRes.status !== 200) throw new Error('Verification failed');
  const token = verifyData.token;
  console.log('Got Token');

  console.log('\n--- 3. Testing Get Categories ---');
  const catRes = await fetch(`${BASE_URL}/vendor/categories`, { method: 'GET' });
  const catData = await catRes.json();
  console.log('Status:', catRes.status);
  console.log('Response:', catData);
  if (catRes.status !== 200) throw new Error('Get Categories failed');

  console.log('\n--- 4. Testing Profile Update (with new fields) ---');
  const profilePayload = {
    businessName: "Test Travels & Tours",
    ownerName: "John Doe",
    profileImage: "https://example.com/profile.jpg",
    businessPhone: "+919998887776",
    description: "Best travel agency",
    category: ["Travel Agency", "Guide"], // Array
    address: "123 Main St",
    bankDetails: {
      accountHolder: "John Doe",
      accountNumber: "1234567890",
      ifscCode: "SBIN0001234",
      bankName: "SBI"
    }
  };

  const profileRes = await fetch(`${BASE_URL}/vendor/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Assuming Middleware expects Bearer token
    },
    body: JSON.stringify(profilePayload)
  });

  const profileData = await profileRes.json();
  console.log('Status:', profileRes.status);
  console.log('Response:', profileData);

  if (profileRes.status !== 200) throw new Error('Profile Update failed');

  console.log('\n--- SUCCESS: All steps passed ---');
}

testVendorFlow().catch(console.error);
