# PahadiGo - Premium Travel & Vendor Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.0.7-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-blue?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**PahadiGo** is a state-of-the-art, full-stack travel marketplace designed to connect travellers with local vendors in the Himalayan region. Built with a high-performance Service-Oriented Architecture, it provides a seamless experience for booking packages, managing businesses, and administrative oversight. **Pahadigo** is a high-performance, full-stack travel marketplace designed for the Himalayan region. It connects travellers with local vendors through a secure, scalable, and professional platform.

---

## 🚀 Key Features

### 👑 Admin Dashboard

- **Analytics**: Real-time stats for revenue, users, and vendor growth.
- **Policy Management**: Professional Rich Text Editor for Privacy, terms, and refund policies.
- **Verification Workflow**: Multi-step document approval for vendors with audit logs.
- **Centralized Control**: Manage categories, travellers, and bookings from a single interface.

### 💼 Vendor Suite

- **Business Profile**: Manage identity, logos, and service specializations.
- **Catalog Control**: Create and manage detailed travel packages and itineraries.
- **KYC Management**: Dedicated portal for uploading and tracking business documents (Aadhar, PAN, etc.).
- **Financial Setup**: Integrated bank detail management for seamless payouts.

### 🏕️ Traveller Journey

- **Discovery**: Browse domestic and international Himalayan packages with rich UI.
- **Secure Payments**: Integrated with **Razorpay** for frictionless checkouts.
- **Account Management**: Track bookings, payment history, and profile settings.

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js 16 (App Router)](https://nextjs.org/) & [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend Logic**: Node.js with a Service-Oriented Architecture (Controllers/Services).
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/).
- **Security**: JWT-based Authentication (hybrid strategy), Social Auth (Google, FB, Apple).
- **Integrations**: [Razorpay](https://razorpay.com/), [MSG91](https://msg91.com/) (SMS), and [Nodemailer](https://nodemailer.com/) (SMTP).

---

## 📁 Architecture Overview

```text
src/
├── app/            # Next.js App Router (Frontend Pages & API Routes)
├── controllers/    # Request handling and response dispatching
├── services/       # Core business logic and database interactions
├── models/         # Mongoose schema definitions
├── middleware/     # Role-based protection and authentication guards
├── helpers/        # Response standardization, JWT, and auth utilities
├── constants/      # Centralized RESPONSE_MESSAGES and system constants
└── seeders/        # Scripts for initial database population
```

---

## ⚙️ Setup & Installation

### 1. Environment Variables

Create a `.env` file in the root directory using `.env.example` as a template:

```env
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
MASTER_OTP=888888  # For development testing
```

### 2. Launch

```bash
# Install dependencies
npm install

# Seed initial data (categories, admin)
npm run seed

# Run in development mode
npm run dev

# Build for production
npm run build
npm start
```

---

## 📄 Documentation & Contribution

- **API Reference**: See [API.md](API.md) for endpoint details.
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md) for design patterns.
- **Guidelines**: Please refer to [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [CONTRIBUTING.md](CONTRIBUTING.md).
- **Security**: Report vulnerabilities as described in [SECURITY.md](SECURITY.md).

---

## ⚖️ License

This project is licensed under the MIT License. Built with ❤️ for Himalayan Travel.
