# PahadiGo - Premium Travel & Vendor Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.0.7-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-blue?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**PahadiGo** is a high-performance, full-stack travel marketplace designed for the Himalayan region. It connects travellers with local vendors through a secure, scalable, and premium platform. Built with a Service-Oriented Architecture, it provides robust tools for vendors to manage their business and authorized admins to oversee the entire ecosystem.

---

## 🚀 Key Features

### 👑 Super Admin Dashboard

A complete command center for platform administration.

- **📊 Advanced Analytics**: Interactive charts for revenue trends, booking distribution, and user/vendor growth (powered by Recharts).
- **📦 Inventory Control**: Global view of all packages with status toggling (Active/Inactive) capabilities.
- **🛡️ Audit Logs**: Comprehensive security tracking of all administrative actions (Who, What, When) for accountability.
- **📣 Marketing Hub**: Manage promotional banners and discount coupons with usage limits and expiry dates.
- **⭐ Review Moderation**: Oversee user feedback, hide inappropriate reviews, and maintain platform quality.
- **📬 Support Inbox**: Centralized system to view and resolve user inquiries.
- **📜 Policy Engine**: Rich-text editing for Privacy Policy, Terms, and Refund rules.
- **✅ Vendor Verification**: Workflow for approving vendor documents (KYC) and activating business profiles.

### 💼 Vendor Suite

Tools for local partners to grow their business.

- **Profile Management**: Customize business identity, logos, and operational details.
- **Package Builder**: Create detailed itineraries with pricing, amenities, and photos.
- **Document Vault**: Secure upload and status tracking for business licenses and ID proofs.
- **Banking Integration**: Manage payout details securely.

### 🏕️ Traveller Experience

A seamless journey for end-users.

- **Smart Discovery**: Browse and filter packages by category, destination, and price.
- **Secure Booking**: Integrated friction-less payments via Razorpay.
- **User Dashboard**: Track upcoming trips, booking history, and profile settings.
- **Authentication**: Easy login via OTP (Email/Phone) or Social Auth (Google, FB, Apple).

---

## 🛠️ Technology Stack

- **Frontend**: [Next.js 16 (App Router)](https://nextjs.org/), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Recharts](https://recharts.org/).
- **Backend**: Node.js API Routes (Next.js), Service-Oriented Architecture.
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) ORM.
- **Authentication**: JWT (JSON Web Tokens), Custom Middleware, OAuth providers.
- **Payment Gateway**: [Razorpay](https://razorpay.com/).
- **Communication**: MSG91 (SMS), Nodemailer (Email).

---

## 📁 Architecture Overview

The project follows a clean, modular structure separating concerns for maintainability.

```text
src/
├── app/                  # Next.js App Router
│   ├── admin/            # Admin Dashboard Pages (Protected)
│   ├── api/              # API Routes (REST Endpoints)
│   ├── user/             # Traveller Pages
│   └── vendor/           # Vendor Portal Pages
├── components/           # Reusable UI Components
│   └── admin/            # Admin-specific components (Sidebar, Charts)
├── controllers/          # Request handling & input validation
├── services/             # Core business logic & DB operations
├── models/               # Mongoose Data Models (Schemas)
├── middleware/           # Auth guards & Request processing
├── helpers/              # Utilities (Response, JWT, upload)
└── constants/            # System-wide constants & config
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites

- Node.js 18+
- MongoDB Instance (Local or Atlas)

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/pahadigo
JWT_SECRET=your_secure_random_string
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
MASTER_OTP=888888  # For dev testing
```

### 3. Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

### 4. Admin Access

To access the admin panel, ensure your user role is set to `admin` in the database, then navigate to `/login` and subsequently `/admin`.

---

## 📄 Documentation

- **API Reference**: Detailed endpoint documentation in [API.md](API.md).

---

## ⚖️ License

This project is licensed under the MIT License.
