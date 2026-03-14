# 🏔️ PahadiGo API Documentation

Welcome to the **PahadiGo** API reference. This documentation provides a comprehensive guide for developers to integrate with our travel and experiences platform.

---

## 🚀 Fundamentals

### Base URL
- **Production**: `https://pahadigo.com/api`
- **Development**: `http://localhost:3000/api`

### Authentication
Most endpoints require a **Bearer Token**. You can obtain a token via the `/auth/login` or `/auth/verify` (OTP) endpoints.

**Headers**:
- `Authorization: Bearer <your_jwt_token>`
- `Content-Type: application/json` (for standard requests)
- `Content-Type: multipart/form-data` (for file uploads or complex nested forms)

### Standard Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

---

## 🔐 1. Authentication & Profile

### Auth Methods
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/otp` | Send OTP to Email/Phone (`role`: 'traveller' or 'vendor') | Public |
| `POST` | `/auth/verify` | Verify OTP and Login/Signup | Public |
| `POST` | `/auth/login` | Password Login (Admin/Dev) | Public |
| `POST` | `/auth/google` | Google Social Login | Public |
| `GET` | `/auth/me` | Get current user's profile | Auth |
| `POST` | `/auth/refresh` | Refresh JWT Token | Auth |
| `POST` | `/auth/logout` | Revoke current session | Auth |

### Password Management
- `POST /auth/forget-password`: Send reset link to email.
- `POST /auth/reset-password`: Update password using reset token.
- `POST /auth/change-password`: Update password (Requires Auth).

---

## 💼 2. Vendor Operations

Vendors manage their business profile, documents, and service listings (Packages).

### Business Profile
- `GET /vendor/business/profile`: Get business details.
- `POST /vendor/business/profile/create`: Initialize business profile.
- `PATCH /vendor/business/profile/update`: Update business information.

### Documentation & Verification
- `GET /vendor/business/documents`: List uploaded documents (Aadhar, PAN, GST, etc.).
- `POST /vendor/business/documents/upload`: Upload new documents (Multipart).
- `PATCH /vendor/business/documents/update`: Update specific document metadata.

### Package & Item Management
- `GET /vendor/packages`: Get all service categories and items.
- `POST /vendor/create-package`: Initialize a new package category.
- `POST /vendor/package/add-item`: Add a service item (e.g., a Homestay or Trek).
- `PATCH /vendor/package/update-item`: Update existing item details.
- `POST /vendor/package/toggle-item`: Enable/Disable a specific item.
- `DELETE /vendor/package/delete-item`: Remove an item.

---

## 🛠️ 3. Admin Operations

Restricted to users with the `admin` role.

### Management
- `GET /admin/stats`: Real-time dashboard statistics.
- `GET /admin/vendors`: List and filter all registered vendors.
- `POST /admin/approve-vendor`: Approve or reject vendor verification (`status`: 'verified'\|'rejected').
- `POST /admin/trigger-ocr`: Run AI OCR on vendor documents to auto-verify identity.
- `GET /admin/audit-logs`: Track all administrative actions.

### Financials & Bookings
- `GET /admin/bookings`: View all system bookings.
- `POST /admin/payout`: Mark a booking as paid out to the vendor.
- `POST /admin/refund`: Process a refund for a cancelled booking.
- `GET /admin/payment-history`: Comprehensive financial logs.

---

## 📦 4. Service Schemas (Deep Dive)

When adding items via `POST /vendor/package/add-item`, use the `category` field with one of the following schemas in the `item[0]` array.

| Category | Schema Target | Key Enums |
| :--- | :--- | :--- |
| `homestay` | `HomestaySchema` | `homestayType`, `roomType`, `mealType` |
| `hotel` | `HotelSchema` | `hotelType`, `roomType`, `starRating` |
| `trekking` | `TrekkingSchema` | `trekType`, `difficultyLevel`, `bestSeason` |
| `rafting` | `RaftingSchema` | `rapidGrade`, `difficultyLevel` |
| `chardham-tour` | `ChardhamTourSchema` | `transportType`, `hotelType` |
| `custom-trip` | `CustomTripSchema` | `serviceType`, `vehicleType` |

### 🏨 Example: Hotel Schema
The Hotel category requires detailed pricing and amenity information.

```json
{
  "category": "hotel",
  "item[0][title]": "String",
  "item[0][hotelType]": "Resort | Luxury | Boutique | Budget | ...",
  "item[0][starRating]": "1-5 (Number)",
  "item[0][availability][totalRooms]": "Number",
  "item[0][pricing][pricePerNight]": "Number",
  "item[0][roomDetails][isAC]": "Boolean",
  "item[0][amenities]": "Comma-separated string",
  "item[0][mealType]": "Breakfast Only | Breakfast & Dinner | ..."
}
```

---

## 🌍 5. Shared & Public Resources

### Categories & Locations
- `GET /categories`: Fetch all active service categories.
- `GET /countries`: List available countries with pagination.
- `GET /countries/:id/states`: Fetch states for a specific country.

### Policies
- `GET /policies/:target`: Fetch all policies for a target (`vendor`\|`traveller`).
- `GET /policies/:target/:type`: Fetch specific policy like `privacy-policy` or `refund-policy`.

---

## ⚠️ 6. Error Reference

| Code | Status | Meaning |
| :--- | :--- | :--- |
| `400` | Bad Request | Validation failed or missing required fields. |
| `401` | Unauthorized | Token is missing or invalid. |
| `403` | Forbidden | Insufficient permissions (e.g., non-admin accessing admin route). |
| `404` | Not Found | Resource (User, Vendor, Package) does not exist. |
| `409` | Conflict | Email or Phone number already registered. |
| `500` | Server Error | Internal system error. Contact support. |
