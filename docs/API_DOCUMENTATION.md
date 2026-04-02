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
| `POST` | `/google` | Google OAuth Login/Registration | Public |
| `POST` | `/facebook` | Facebook OAuth Login/Registration | Public |
| `POST` | `/apple` | Apple OAuth Login/Registration | Public |
| `POST` | `/forget-password` | Initiates password reset flow | Public |
| `GET` | `/me` | Returns current authenticated user profile | Private |
| `POST` | `/logout` | Invalidates current session | Private |
| `POST` | `/logout-all` | Invalidates all active sessions | Private |
| `POST` | `/update-profile` | Updates personal/account information | Private |
| `POST` | `/delete-profile` | Marks user account for deletion | Private |

---

## 🏔️ 2. Traveler Features (`/traveller`)

| Method | Path | Description | Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/packages/search` | Performs geospatial package search with filters | Public/Auth |
| `POST` | `/book` | Initializes a transactional booking session | Traveller |
| `GET` | `/bookings` | List of traveler's historical and active bookings | Traveller |
| `GET` | `/bookings/:id` | Detailed view of a specific booking | Traveller |
| `PATCH` | `/bookings/:id/cancel` | Requests cancellation of a booking | Traveller |
| `POST` | `/bookings/:id/dispute` | Raises a formal dispute for a booking | Traveller |
| `POST` | `/reviews` | Submits star rating and review for a package | Traveller |
| `POST` | `/sos` | Triggers emergency alert to contacts | Traveller |
| `GET` | `/wishlist` | Returns user's saved items | Traveller |
| `POST` | `/wishlist` | Adds an item to the wishlist | Traveller |
| `DELETE` | `/wishlist/:itemId` | Removes an item from the wishlist | Traveller |
| `POST` | `/payment/create-order` | Generates a Razorpay Order ID | Traveller |
| `POST` | `/payment/verify` | Verifies Razorpay payment signature | Traveller |

---

## 💼 3. Vendor Operations (`/vendor`)

### Business & Profile
| Method | Path | Description | Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/business/profile` | Returns full business, KYC, and document status | Vendor |
| `POST` | `/business/profile/create` | Initializes a new Vendor business node | Vendor |
| `PATCH` | `/business/profile/update` | Updates business profile details | Vendor |
| `GET` | `/business/documents` | List of uploaded KYC documents | Vendor |
| `POST` | `/business/documents/upload` | Uploads new business KYC documents | Vendor |
| `GET` | `/bank` | Returns vendor's registered bank details | Vendor |
| `POST` | `/bank/create` | Registers new bank account for payouts | Vendor |

### Inventory & Packages
| Method | Path | Description | Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/packages` | List of all packages owned by vendor | Vendor |
| `POST` | `/create-package` | Initializes a new base package container | Vendor |
| `POST` | `/package/add-item` | Adds a polymorphic service (Trek/Stay/etc.) | Vendor |
| `PATCH` | `/package/update-item` | Updates details of a polymorphic service | Vendor |
| `DELETE` | `/package/delete-item` | Removes a specific service from a package | Vendor |
| `POST` | `/package/toggle-item` | Enables/Disables a specific service | Vendor |
| `GET` | `/inventory/:itemId` | Returns real-time availability/stock | Vendor |
| `POST` | `/inventory/update` | Updates availability calendar for a service | Vendor |

---

## 🛠️ 4. Administration Command Center (`/admin`)

| Method | Path | Description | Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/stats` | Global dashboard metrics (Revenue, Users, etc.) | Admin |
| `GET` | `/analytics` | Time-series data for Recharts visualization | Admin |
| `GET` | `/audit-logs` | Immutable history of administrative actions | Admin |
| `GET` | `/vendors` | List of all registered vendors | Admin |
| `POST` | `/approve-vendor` | Evaluates and flips the `isApproved` flag | Admin |
| `POST` | `/trigger-ocr` | Manually triggers AI text extraction on docs | Admin |
| `GET` | `/bookings` | Global list of all system bookings | Admin |
| `POST` | `/refund` | Executes Razorpay refund state machine | Admin |
| `GET` | `/disputes` | List of all active traveler-vendor disputes | Admin |
| `POST` | `/marketing/banners` | Manages homepage promotional banners | Admin |
| `POST` | `/marketing/coupons` | Manages discount codes and validity | Admin |

---

## 📦 Request / Response Standards

- **Content-Type**: `application/json` (or `multipart/form-data` for uploads)
- **Authentication**: `Authorization: Bearer <JWT_TOKEN>`
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
