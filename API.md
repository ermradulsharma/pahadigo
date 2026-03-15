# 🏔️ PahadiGo API Documentation

Welcome to the **PahadiGo** API reference. This living documentation provides a comprehensive guide for developers, mobile app teams, and third-party integrators to connect with our travel and experiences platform.

---

## 🚀 1. Core Fundamentals

### Base URL
All API requests must be prefixed with the appropriate base URL:

- **Production**: `https://api.pahadigo.com/v1`
- **Development**: `http://localhost:3000/api`

### Authentication Protocols

PahadiGo utilizes a secure, stateless JWT strategy. Depending on the endpoint, authentication is provided via the standard Authorization header.

**Headers required for secured endpoints**:
```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```
> [!NOTE]
> File uploads (like KYC documents or profile pictures) require the `Content-Type: multipart/form-data` header rather than standard JSON.

### Standardized Response Contract

Every endpoint strictly adheres to the following JSON structure to ensure predictable parsing on the client side:

```json
{
  "success": true,        // Boolean indicating the exact result
  "message": "Operation successful",
  "data": {               // Relevant payload or pagination wrapper
    "id": "60d0fe4f5311236168a109ca"
  }
}
```

---

## 🔐 2. Authentication & IAM

### Universal Auth Endpoints

| Method | Path | Description | Access Level |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/otp` | Trigger SMS/Email OTP (`role`: 'traveller' or 'vendor') | Public |
| `POST` | `/auth/verify` | Verify OTP and authenticate session | Public |
| `POST` | `/auth/login` | Email/Password Login (Reserved for Admin/Devs) | Public |
| `POST` | `/auth/google` | OAuth2 Google Social Identity | Public |
| `GET` | `/auth/me` | Fetch detailed context about the current authorized user | Auth |
| `POST` | `/auth/refresh` | Refresh an expiring JWT Token | Auth |
| `POST` | `/auth/logout` | Revoke the active session token | Auth |

### Password Recovery Suite
- `POST /auth/forget-password`: Dispatches a secure reset link to the email.
- `POST /auth/reset-password`: Commits a new password utilizing the reset token.
- `POST /auth/change-password`: Safely updates password (Requires active Auth).

---

## 💼 3. Vendor Operations (B2B)

Vendors manage their financial profiles, legal compliance, and regional travel listings.

### Business Identity & Ledger
- `GET /vendor/business/profile`: Fetch banking and business metadata.
- `POST /vendor/business/profile/create`: Bootstrap a fresh business profile.
- `PATCH /vendor/business/profile/update`: Modify active business information.

### KYC Documentation
- `GET /vendor/business/documents`: Retrieve current document verification status.
- `POST /vendor/business/documents/upload`: Dispatch files (Multipart) to Cloudinary.
- `PATCH /vendor/business/documents/update`: Adjust metadata for existing physical docs.

### Catalog Management
Manage trekking routes, homestays, and tour itineraries:
- `GET /vendor/packages`: Return all configured categories and items.
- `POST /vendor/create-package`: Draft a new master package category.
- `POST /vendor/package/add-item`: Append a specialized service item to a package.
- `PATCH /vendor/package/update-item`: Refresh item variants or inventory.
- `POST /vendor/package/toggle-item`: Halt/Resume bookings for an item.
- `DELETE /vendor/package/delete-item`: Permanently expunge an item.

---

## 🛠️ 4. Super Admin Operations

Protected management layer, exclusively restricted to the `admin` RBAC role.

### Enterprise Governance
- `GET /admin/stats`: Master timeline and system KPI statistics.
- `GET /admin/vendors`: Global directory, filterable by activation state.
- `POST /admin/approve-vendor`: Authorize or reject vendor compliance (`status`: `verified`\|`rejected`).
- `POST /admin/trigger-ocr`: Initialize Machine Vision to auto-verify documents.
- `GET /admin/audit-logs`: Pagination trace of all sovereign administrative actions.

### Financial Oversight
- `GET /admin/bookings`: Live ledger of all system transactions.
- `POST /admin/payout`: Reconcile a successfully serviced booking and issue vendor payout.
- `POST /admin/refund`: Execute a payment gateway refund against a cancelled itinerary.
- `GET /admin/payment-history`: Comprehensive audit of all gross volume.

---

## 📦 5. Service Schemas 

### Dynamic Polymorphic Schemas
When registering inventory via `POST /vendor/package/add-item`, dynamic validation is enforced against the `category` identifier.

| Category Enum | Schema Target | Specialized Keys |
| :--- | :--- | :--- |
| `homestay` | `HomestaySchema` | `homestayType`, `roomType`, `mealType` |
| `hotel` | `HotelSchema` | `hotelType`, `roomType`, `starRating` |
| `trekking` | `TrekkingSchema` | `trekType`, `difficultyLevel`, `bestSeason` |
| `rafting` | `RaftingSchema` | `rapidGrade` |
| `chardham-tour` | `ChardhamTourSchema` | `transportType`, `hotelType` |
| `custom-trip` | `CustomTripSchema` | `serviceType`, `vehicleType` |

> [!TIP]
> **Example Payload: Committing a Hotel Item**
> ```json
> {
>   "category": "hotel",
>   "item[0][title]": "Himalayan View Resort",
>   "item[0][hotelType]": "Resort",
>   "item[0][starRating]": 5,
>   "item[0][availability][totalRooms]": 14,
>   "item[0][pricing][pricePerNight]": 4500,
>   "item[0][roomDetails][isAC]": false,
>   "item[0][mealType]": "Breakfast & Dinner"
> }
> ```

---

## 🌍 6. Shared Master Data

### Geography & Metadata
- `GET /categories`: Real-time dictionary of available travel categories.
- `GET /countries`: Paginated catalog of ISO-supported countries.
- `GET /countries/:id/states`: Fetch localized states/provinces.

### Dynamic Policies
- `GET /policies/:target`: Retrieve T&C for specific RBAC layers (`vendor`\|`traveller`).
- `GET /policies/:target/:type`: Narrow search to `privacy-policy` or `refund-policy`.

---

## ⚠️ 7. HTTP Status Codes & Error Diagnosis

We utilize standard RESTful semantics.

| Code | Status | Diagnosis |
| :--- | :--- | :--- |
| `400` | Bad Request | Schema validation failure, corrupt JSON, or missing parameters. |
| `401` | Unauthorized | Token is malformed, missing, or crypto-signature failed validation. |
| `403` | Forbidden | Insufficient RBAC clearance for the invoked endpoint. |
| `404` | Not Found | Requested entity UUID or slug doesn't exist. |
| `409` | Conflict | Data contention, typically an email/phone number duplication. |
| `429` | Too Many Requests | Rate-limiter triggered across high-value routes (e.g. Auth). |
| `500` | Server Error | Uncaught Node.js exception. Incident reported. |
