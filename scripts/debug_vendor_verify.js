const BASE_URL = 'http://localhost:3001/api';

async function debugVendorVerify() {
  const timestamp = Date.now();
  const email = `vendor_debug_${timestamp}@test.com`;
  
  console.log(`Debug Vendor Verify with Email: ${email}`);

  // 1. Send OTP
  console.log('1. Sending OTP...');
  let res = await fetch(`${BASE_URL}/auth/otp`, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  if (!res.ok) {
      console.error('Send OTP Failed:', await res.text());
      return;
  }
  let data = await res.json();
  const otp = data.dev_otp;
  console.log('OTP Sent:', otp);

  // 2. Verify as Vendor
  console.log('2. Verifying as Vendor...');
  res = await fetch(`${BASE_URL}/auth/verify`, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        email, 
        otp, 
        role: 'vendor' // Explicitly requesting vendor
    })
  });

  const text = await res.text();
  console.log('Response Status:', res.status);
  console.log('Response Body:', text);

  try {
      const json = JSON.parse(text);
      if (res.status === 200 && json.isNewUser === true && json.role === 'vendor') {
          console.log('SUCCESS: Vendor verified and identified as New User.');
      } else {
          console.log('FAILURE: Unexpected response state.');
      }
  } catch (e) {
      console.log('FAILURE: Invalid JSON response');
  }
}

debugVendorVerify().catch(console.error);
