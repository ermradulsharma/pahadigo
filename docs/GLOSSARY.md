# 📖 Glossary — PahadiGo

**Owner:** Er. Mradul Sharma
**Platform:** Next.js 16 Marketplace Infrastructure

This document serves as the "Domain Language" guide for all developers on the PahadiGo project. It ensures consistent naming and shared understanding across the **Service-Oriented Architecture (SOA)** layers.

---

## 🏗️ Technical Domain Terms

- **`SOA Kernel`**: The logic layer (located in `src/core`) that functions independently of the `src/app` (Next.js) presentation layer.
- **`Polymorphic Discriminator`**: The Mongoose mechanism (in `src/core/Models/Package.js`) that allows different travel categories (like `Trekking`, `Homestay`, or `Rental`) to share a single base collection while having unique, strictly-typed schemas.
- **`OCR Pipeline`**: The server-side process using `Tesseract.js` and `Cloudinary` to automatically extract text from traveler and vendor government IDs (Aadhar/PAN).
- **`JWT Orchestration`**: The flow of generating, refreshing, and verifying JSON Web Tokens to maintain session security across API boundaries.
- **`AuditLog Subsystem`**: The non-destructive logging service that records all administrative actions for forensic history.

---

## 🏢 Business Logic Terms

- **`Vendor Trust Badge`**: A dynamically calculated score (stored in the Vendor model) that increases with each successful OCR verification, booking completion, and high star-rating.
- **`Service Item`**: An individual instance within a vendor's package (e.g., a specific "Kedarnath 5-day Trek" is a service item within a "Trekking Packages" catalog).
- **`Dispute Lifecycle`**: The state-machine for handling traveler complaints against vendors (States: `open`, `investigating`, `resolved_refunded`, `resolved_rejected`).
- **`Experience Catalog`**: The public-facing collection of all active, location-verified vendor service items available to travelers.
- **`KYC (Know Your Customer)`**: The mandatory verification process for vendors to upload their business documents and government IDs before their packages can go live.

---

## 🏔️ Geography & Himalayan Context

- **`PahadiGo Territory`**: A specific region in the Himalayas (e.g., Kumaon, Garhwal) used for geospatial search optimization.
- **`Experience Category`**: The high-level grouping of traveler activities (e.g., `Adventure`, `Religious`, `Nature`).
- **`Checkout State`**: The intermediate state for a booking that has been initiated but not yet paid via Razorpay.

---

## 📡 Messaging & Notifications

- **`Transactional OTP`**: A 6-digit one-time password sent via **MSG91** for mission-critical authentication.
- **`System Payload`**: The JSON response structure returned by the `apiHandler` utility (contains `success`, `message`, and `data`).
- **`Webhook Lifecycle`**: The process of receiving and verifying asymmetric signatures from **Razorpay** to confirm payments in the background.

*This glossary is maintained by Er. Mradul Sharma and should be updated whenever new domain-specific concepts are introduced.*
