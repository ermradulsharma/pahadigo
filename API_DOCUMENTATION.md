# 📡 PahadiGo REST API Documentation

**Version:** 2.1.0
**Project Lead:** Er. Mradul Sharma
**Base URL:** `/api` (Proxied via Next.js App Router)

This document provides a comprehensive reference for all architectural endpoints within the PahadiGo ecosystem. All requests (except public ones) require a valid **JWT Bearer Token** in the `Authorization` header.

---

## 🔐 1. Authentication (`/auth`)

| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/otp` | Sends a login/register OTP via MSG91 | Public |
| `POST` | `/verify` | Validates OTP and returns JWT + User Context | Public |
| `POST` | `/login` | Standard Password Login (Admin/Staff) | Public |
| `GET` | `/me` | Returns the current authenticated user profile | Private |
| `PATCH` | `/update-profile` | Updates personal/account information | Private |

---

## 🏔️ 2. Traveler Features (`/traveller`)

| Method | Path | Description | Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/packages/search` | Performs geospatial package search with filters | Public/Auth |
| `POST` | `/book` | Initializes a transactional booking session | Traveller |
| `GET` | `/bookings` | List of traveler's historical and active bookings | Traveller |
| `POST` | `/reviews` | Submits a star rating and text review for a package | Traveller |
| `POST` | `/sos` | Triggers immediate emergency alert to contacts | Traveller |
| `POST` | `/wishlist` | Adds a specific service item to the user's wishlist | Traveller |

---

## 💼 3. Vendor Operations (`/vendor`)

| Method | Path | Description | Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/business/profile` | Returns full business, KYC, and document status | Vendor |
| `POST` | `/business/create` | Initializes a new Vendor business node | Vendor |
| `POST` | `/package/add-item` | Adds a polymorphic service (Trek/Stay/etc.) | Vendor |
| `POST` | `/payment/payout` | (Legacy) Returns settlement history | Vendor |
| `GET` | `/bookings` | List of all bookings assigned to this vendor | Vendor |

---

## 🛠️ 4. Administration Command Center (`/admin`)

| Method | Path | Description | Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/stats` | Global dashboard metrics (Revenue, Users, Growth) | Admin |
| `GET` | `/analytics` | Time-series data for Recharts visualization | Admin |
| `GET` | `/audit-logs` | Immutable history of administrative actions | Admin |
| `POST` | `/approve-vendor` | Evaluates and flips the `isApproved` flag | Admin |
| `POST` | `/trigger-ocr` | Manually triggers AI text extraction on docs | Admin |
| `POST` | `/refund` | Executes Razorpay refund state machine | Admin |

---

## 🧪 5. Utility & Geography (`/`)

| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | List of all travel service categories | Public |
| `GET` | `/countries` | Regional geography list (ISO codes) | Public |
| `GET` | `/states` | List of states mapped to countries | Public |
| `GET` | `/policies/:target` | Public terms, privacy, and refund policies | Public |

---

## 📦 Request / Response Standards

- **Content-Type**: `application/json` (or `multipart/form-data` for uploads)
- **Error Format**:
```json
{
  "success": false,
  "message": "Detailed error message",
  "data": {}
}
```
- **Success Format**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

*For detailed schema definitions and payload examples, refer to `src/core/Helpers/validation.js`.*
