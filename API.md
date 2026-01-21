# PahadiGo API Reference

All API requests should be sent to `/api/...`. Headers should include `Authorization: Bearer <token>` for protected routes.

## Authentication

### Send OTP

- **URL:** `POST /api/auth/otp`
- **Body:** `{ "email": "string", "phone": "string", "role": "user|vendor" }`
- **Description:** Generates and logs an OTP for development.

### Verify OTP & Login

- **URL:** `POST /api/auth/verify`
- **Body:** `{ "identifier": "string", "otp": "string" }`
- **Success Response:** `200 OK` with `{ "token": "...", "role": "...", "isNewUser": "boolean" }`

### Google Login

- **URL:** `POST /api/auth/google`
- **Body:** `{ "idToken": "string", "role": "user|vendor" }`

---

## User Endpoints

### Browse Packages

- **URL:** `GET /api/user/packages`
- **Description:** Returns all packages from approved vendors.

### Book a Package

- **URL:** `POST /api/user/book` (Protected)
- **Body:** `{ "packageId": "string", "travelDate": "YYYY-MM-DD" }`

---

## Vendor Endpoints

### Get Categories

- **URL:** `GET /api/vendor/categories`
- **Description:** Returns a list of supported vendor categories (Homestay, Trekking, etc.).

### Update Profile

- **URL:** `POST /api/vendor/profile` (Protected)
- **Body:** `{ "businessName": "string", "category": "string", ... }`

### Create Package

- **URL:** `POST /api/vendor/create-package` (Protected)
- **Body:** `{ "title": "string", "price": "number", "description": "string", "duration": "string" }`

---

## Payment Endpoints

### Create Razorpay Order

- **URL:** `POST /api/payment/create-order` (Protected)
- **Body:** `{ "bookingId": "string" }`

### Verify Payment

- **URL:** `POST /api/payment/verify` (Protected)
- **Body:** `{ "razorpay_order_id": "... ", "razorpay_payment_id": "...", "razorpay_signature": "..." }`

---

## Admin Endpoints

### Dashboard Stats

- **URL:** `GET /api/admin/stats` (Admin Only)

### Vendor Approval

- **URL:** `POST /api/admin/approve-vendor` (Admin Only)
- **Body:** `{ "vendorId": "string" }`

### Manage Payouts & Refunds

- **URL:** `POST /api/admin/payout` | `POST /api/admin/refund` (Admin Only)
- **Body:** `{ "bookingId": "string" }`
