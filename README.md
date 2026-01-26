# PahadiGo - Premium Travel & Vendor Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.0.7-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-blue?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**PahadiGo** is a state-of-the-art, full-stack travel marketplace designed to connect travellers with local vendors in the Himalayan region. Built with a high-performance Service-Oriented Architecture, it provides a seamless experience for booking packages, managing businesses, and administrative oversight.

---

## 🌟 Key Modules

### 👑 Advanced Admin Portal

A centralized command center for platform governance:

- **Comprehensive Statistics**: Real-time revenue tracking, user growth, and vendor metrics.
- **Granular Policy Management**: Professional Rich Text Editor (**react-quill-new**) for managing Privacy, Terms, and Refund policies for all stakeholder groups.
- **Two-Step Vendor Approval**: Rigorous document verification workflow with individual document status tracking (Approved/Rejected/Pending).
- **Traveller & Booking Oversight**: Full lifecycle management of all platform interactions.
- **Secure Admin Profile**: Personalized admin settings with social link integration and professional bios.

### 💼 Vendor Ecosystem

Empowering local businesses with professional tools:

- **Business Identity**: Customizable profiles with logo uploads and category specialization.
- **Catalog Management**: Dynamic package creation with pricing, itineraries, and availability.
- **Identity Verification**: Multi-document upload system for Aadhar, PAN, and Business Registrations.
- **Bank Integration**: Managed payout details with document proof (Cancelled Cheque).

### 🏕️ Traveller Experience

A frictionless journey from discovery to booking:

- **Curated Discoveries**: Browse trending domestic and international packages.
- **Secure Checkout**: Integrated payment flow with **Razorpay**.
- **Transparent Booking**: Real-time status updates and cancellation management.

---

## 🛠️ Tech Stack & Resilience

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) with Turbopack.
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/).
- **Rich Text**: [react-quill-new](https://www.npmjs.com/package/react-quill-new) (React 19 Compatible).
- **Authentication**: Hybrid JWT Strategy with role-based Middleware.
- **Payments**: [Razorpay](https://razorpay.com/) Payment Links & API integration.
- **Resilience**: Implemented `isMounted` hydration guards and defensive data rendering for 99.9% client-side stability.

---

## 📁 Project Architecture

```text
travels/
├── src/
│   ├── app/            # Next.js 16 App Router & Dynamic Routes
│   ├── controllers/    # API Dispatched Handlers
│   ├── services/       # Core Business Logic & Data Transformation
│   ├── models/         # Mongoose Document Definitions
│   ├── middleware/     # Auth, Role & Security Middleware
│   ├── helpers/        # JWT, Response Standardization & Auth Utils
│   ├── components/     # High-density UI Components (Admin/Vendor/Public)
│   └── seeders/        # Initial Data Population Scripts
├── public/             # Static Assets & Dynamic Uploads
└── tests/              # Jest & Supertest Suite
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: v18 or higher (v20+ recommended)
- **MongoDB**: Active instance (Local or Atlas)
- **Environment**: Professional IDE (VS Code recommended)

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_hyper_secure_secret
RAZORPAY_KEY_ID=your_razorpay_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Quick Installation & Launch

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 🧪 Testing Coverage

PahadiGo prioritizes stability with an isolated testing environment using an In-Memory MongoDB server.

- **Unit Service Testing**: `npm test -- tests/unit`
- **Integration API Testing**: `npm test -- tests/api`

---

## 📄 License & Contributing

This project is licensed under the MIT License. Designed and maintained for excellence in Himalayan travel management.
