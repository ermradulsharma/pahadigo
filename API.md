# PahadiGo API Documentation

This document provides a reference for the REST API endpoints available in the PahadiGo platform.

## Base URL

All API requests should be made to: `/api` (e.g., `http://localhost:3000/api`)

## Authentication

Most endpoints require a Bearer Token.
`Authorization: Bearer <your_jwt_token>`

| Method | Endpoint       | Description                | Auth Required |
| :----- | :------------- | :------------------------- | :------------ |
| `POST` | `/auth/otp`    | Send OTP to Email/Phone    | No            |
| `POST` | `/auth/verify` | Verify OTP & Login/Signup  | No            |
| `POST` | `/auth/login`  | Password Login (Admin/Dev) | No            |
| `POST` | `/auth/google` | Google OAuth Login         | No            |
| `GET`  | `/auth/me`     | Get Current User Profile   | **Yes**       |

---

## 👑 Admin Endpoints

Management routes for the dashboard.

| Method  | Endpoint                   | Description                         |
| :------ | :------------------------- | :---------------------------------- |
| `GET`   | `/admin/stats`             | Dashboard overview statistics       |
| `GET`   | `/admin/analytics`         | Advanced charts (revenue, growth)   |
| `GET`   | `/admin/audit-logs`        | View administrative action history  |
| `GET`   | `/admin/users`             | List all users (Travellers/Vendors) |
| `POST`  | `/admin/approve-vendor`    | Approve/Reject vendor verification  |
| `GET`   | `/admin/packages`          | Inventory management                |
| `PATCH` | `/admin/packages`          | Toggle package status               |
| `GET`   | `/admin/reviews`           | Moderation queue for reviews        |
| `POST`  | `/admin/marketing/banners` | Create promotional banner           |
| `POST`  | `/admin/marketing/coupons` | Create discount coupon              |

---

## 💼 Vendor Endpoints

Routes for vendor business operations.

| Method | Endpoint                  | Description                 |
| :----- | :------------------------ | :-------------------------- |
| `GET`  | `/vendor/profile`         | Get business profile        |
| `POST` | `/vendor/profile/update`  | Update business details     |
| `POST` | `/vendor/create-package`  | Create a new travel package |
| `GET`  | `/vendor/packages`        | List own packages           |
| `POST` | `/vendor/document/upload` | Upload KYC documents        |

---

## 🏕️ User / Public Endpoints

Routes for travellers and public browsing.

| Method | Endpoint         | Description              |
| :----- | :--------------- | :----------------------- |
| `GET`  | `/user/packages` | Browse/Search packages   |
| `POST` | `/user/book`     | Book a package           |
| `POST` | `/inquiries`     | Submit a support viewing |

---

## Response Format

Standard response structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

Error response:

```json
{
  "success": false,
  "message": "Error description",
  "error": { ... }
}
```
