# PahadiGo - Premium Himalayan Travel & Vendor Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-blue?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**PahadiGo** is a specialized full-stack travel marketplace dedicated to the Himalayan region. It facilitates a premium, secure, and highly scalable ecosystem connecting adventurous travellers with verified local vendors. The platform is architected to handle complex travel services like trekking, camping, homestays, and Chardham tours with a focus on regional authenticity and modern UX.

---

## 🏔️ Project Vision

PahadiGo isn't just a booking site; it's a regional travel infrastructure. Our goal is to empower local Himalayan communities by providing them with enterprise-grade tools to digitize their offerings, while giving travellers a trustworthy gateway to explore the mountains with safety and premium service standards.

---

## 🚀 Key Modules

### ⚙️ Core Engine (`src/core`)

The brain of the application, built on a **Service-Oriented Architecture (SOA)**:

- **Services**: Decoupled business logic for Auth, Bookings, Packages, and Vendor management.
- **Models**: 17+ Mongoose schemas including `AuditLog`, `Package`, `VendorDocument`, and `SearchLog`.
- **Controllers**: Thin API handlers managing request orchestration.
- **Helpers**: Robust utilities for response formatting, JWT handling, and OTP generation.

### 👑 Super Admin Command Center

Complete platform oversight and governance:

- **KYC & Verification**: Detailed workflow for approving `VendorDocument` submissions.
- **Inventory Control**: Global management of `Packages` and `Categories`.
- **Marketing & Promotions**: Management of `Banners` and `Coupons` with granular usage rules.
- **Audit & Security**: Comprehensive `AuditLog` system tracking every administrative change.
- **Moderation**: Centralized system for `Review` management and `Inquiry` resolution.

### 💼 Vendor Enterprise Suite

Professional tools for local service providers:

- **Dynamic Package Builder**: Create complex itineraries for Trekking, Rafting, and more.
- **Business Identity**: Comprehensive `Vendor` profile management including banking and branding.
- **Operational Insights**: Track bookings and customer inquiries in real-time.

### 🏕️ Premium Traveller Experience

A frictionless journey for modern explorers:

- **Smart Discovery**: Category-based filtering and location-aware search.
- **Booking Workflow**: Secure checkout integrated with `Razorpay`.
- **Authentication**: Multi-channel login (OTP via SMS/Email, Google, FB, Apple).
- **Interactive UI**: Powered by Tailwind CSS 4.0 and Recharts for a data-rich experience.

---

## 🛠️ Technology Stack

| Layer             | Technology                       |
| :---------------- | :------------------------------- |
| **Framework**     | Next.js 15.1.6 (App Router)      |
| **Styling**       | Tailwind CSS 4.0 + PostCSS       |
| **Database**      | MongoDB + Mongoose 9.1.5         |
| **Payments**      | Razorpay 2.9.6                   |
| **Auth**          | JWT + Google Auth Library        |
| **Messaging**     | MSG91 (SMS) + Nodemailer (Email) |
| **Visualization** | Recharts 3.7.0                   |

---

## 📁 Project Structure

```text
src/
├── app/                  # Next.js App Router (UI & API Handlers)
│   ├── (website)/        # Public-facing traveller pages
│   ├── admin/            # Admin Dashboard (Protected)
│   └── api/              # API Route Handlers
├── core/                 # Business Logic & Infrastructure
│   ├── Controllers/      # API Controllers
│   ├── Services/         # SOA Logic (Auth, Booking, etc.)
│   ├── Models/           # Mongoose Schemas (17+ Models)
│   ├── Database/         # DB Configuration & Seeders
│   ├── Helpers/          # Utility functions
│   └── Config/           # App-wide configurations
├── components/           # UI Components (Client/Server)
├── public/               # Static assets
└── tests/                # Jest & Supertest suites
```

---

## ⚙️ Setup & Installation

### 1. Requirements

- Node.js 20+
- MongoDB Atlas or local instance

### 2. Configure Environment

Clone `.env.example` to `.env` and provide your credentials:

```env
MONGODB_URI=
JWT_SECRET=
RAZORPAY_KEY_ID=
CLOUDINARY_URL=
SMTP_PASS=
```

### 3. Initialize & Run

```bash
# Install dependencies
npm install

# Seed the database (creates initial categories/settings)
npm run seed

# Start development
npm run dev
```

---

## 📄 Documentation

- **API Reference**: Detailed in [API.md](API.md)
- **Deep Architecture**: Explored in [ARCHITECTURE.md](ARCHITECTURE.md)

---

## ⚖️ License

Licensed under the [MIT License](LICENSE.md).
