# 📊 PahadiGo Database Schema & Persistence

**Schema Version:** 2.0.0
**Persistence Engine:** MongoDB (via Mongoose ODM)
**Primary Architecture:** Polymorphic Service-Oriented Models

This document outlines the core data models and their relational mappings within the PahadiGo ecosystem.

---

## 🏗️ 1. Identity & Role Matrix (`User`)

The `User` model is the central identity node. It leverages a single-collection approach for Travellers, Vendors, and Admins, differentiated by the `role` enum.

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `String` | Legal name of the user or business contact. |
| `email` | `String` | Unique, lowercase identifier (indexed). |
| `phone` | `String` | Mobile number (unique, indexed). Primary OTP target. |
| `role` | `Enum` | `traveller`, `vendor`, `admin`, `staff`. |
| `authProvider` | `Enum` | `local`, `google`, `facebook`, `apple`. |
| `emergencyContacts` | `Array` | List of Sos contacts (Name, Phone, Relationship). |
| `fcmTokens` | `Array` | Firebase Cloud Messaging tokens for push alerts. |

---

## 🏔️ 2. Polymorphic Inventory (`Package`)

PahadiGo uses a **One-to-Many Multi-Discriminator** pattern for travel services. A single `Package` collection entry belongs to a `Vendor` and contains arrays of specific services.

### Core Structure
- **Base Package**: Linked to a `vendor` (ObjectId).
- **Sub-Schemas**: Embedded within category arrays (`homestay`, `trekking`, `rafting`, etc.).

### Polymorphic Service Attributes
Every service item (e.g., a specific Trek or Homestay) inherits common traits but has heterogeneous fields:

| Category | Specialized Fields |
| :--- | :--- |
| **Homestay** | Room types, Meal policies, Hot-water, Parking. |
| **Trekking** | Difficulty (Easy/Mod/Hard), Max Altitude, Porter availability. |
| **Rafting** | River Grade (I-V), Equipment inclusion, Age limits. |
| **Vehicle Rental** | Model, Seat count, Transmission, Fuel type. |

---

## 📅 3. Transactional Engine (`Booking`)

The `Booking` model facilitates the lifecycle of a reservation from initiation to payout/refund.

| Field | Type | Description |
| :--- | :--- | :--- |
| `user` | `ObjectId` | Reference to the `User` who booked. |
| `package` | `ObjectId` | Reference to the `Package` container. |
| `preferences` | `Object` | Stores the specific `category` and `itemId` within the package. |
| `status` | `Enum` | `pending`, `confirmed`, `cancelled`, `completed`. |
| `paymentStatus`| `Enum` | `pending`, `paid`, `failed`. |
| `razorpay` | `Object` | Stores `orderId`, `paymentId`, and HMAC `signature`. |
| `timeline` | `Array` | Non-destructive audit trail of booking state changes. |

---

## 🛡️ 4. Compliance & Verification

### `VendorDocument` & `VerifiedIdentity`
- **Purpose:** Stores legal document metadata (Aadhar, PAN, Insurance).
- **Automation:** Linked to the OCR pipeline (`Tesseract.js`) results stored in `VerifiedIdentity`.

### `AuditLog`
- **Purpose:** Passively intercepts all `PATCH` and `DELETE` commands in the administration portal.
- **Data:** Stores `action`, `targetModel`, `targetId`, `previousState`, `newState`, and `performerId`.

---

## 📈 5. Global Analytics & Config

- **`Setting`**: Runtime flags (App Maintenance mode, API keys distribution, Platform Fees %).
- **`SearchLog`**: Anonymized traveler search queries to generate geographical demand heatmaps.
- **`Review`**: Cross-referenced ratings for both Packages and individual Service Items.

---

## ⚙️ Indexing Strategy

To maintain performance across millions of geographical nodes, PahadiGo implements:
1. **Compound Text Indexes**: On `Package` titles and descriptions for fuzzy multilingual search.
2. **Geospatial Indexes (2dsphere)**: On `User` and `Vendor` addresses to facilitate "Near Me" discovery.
3. **Partial Indexes**: On identity fields (`googleId`, `email`) to allow null values while maintaining uniqueness.
