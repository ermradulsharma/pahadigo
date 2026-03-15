<div align="center">

# 🏔️ PahadiGo

**Premium Himalayan Travel & Vendor Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-blue?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

[Overview](#-project-vision) •
[Features](#-key-modules) •
[Tech Stack](#-technology-stack) •
[Architecture](#-architecture) •
[Getting Started](#-setup--installation)

</div>

---

## 🏔️ Project Vision

**PahadiGo** is a specialized, full-stack travel marketplace dedicated to the Himalayan region. It facilitates a premium, secure, and highly scalable ecosystem connecting adventurous travellers with verified local vendors. 

Our mission is to empower local Himalayan communities by providing them with enterprise-grade tools to digitize their offerings, while giving travellers a trustworthy gateway to explore the mountains with safety and premium service standards.

---

## 🚀 Key Modules

### 🏕️ Premium Traveller Experience
A frictionless journey for modern explorers:
- **Smart Discovery**: Category-based filtering and location-aware search.
- **Booking Workflow**: Secure checkout integrated with `Razorpay`.
- **Authentication**: Multi-channel passwordless login (OTP via SMS/Email, Google, Facebook, Apple).
- **Interactive UI**: Powered by Tailwind CSS 4.0 and customized interactive components.

### 💼 Vendor Enterprise Suite
Professional toolkit for local service providers:
- **Dynamic Package Builder**: Create complex itineraries for Trekking, Rafting, Homestays, and Chardham Tours.
- **Business Identity**: Comprehensive `Vendor` profile management including banking, branding, and required KYC documents.
- **Operational Insights**: Track bookings, financial ledgers, and customer inquiries in real-time.

### 👑 Super Admin Command Center
Complete platform oversight and governance:
- **KYC & Verification**: OCR-powered workflow for approving `VendorDocument` submissions.
- **Inventory Control**: Global management of `Packages` and `Categories`.
- **Marketing & Promotions**: Management of `Banners` and `Coupons` with granular usage rules.
- **Audit & Security**: Comprehensive `AuditLog` system tracking every administrative action.

---

## 🛠️ Technology Stack

| Layer             | Technology                       | Description                                  |
| :---------------- | :------------------------------- | :------------------------------------------- |
| **Framework**     | Next.js 15.1.6 (App Router)      | SSR/SSG and API route handlers               |
| **Styling**       | Tailwind CSS 4.0                 | Utility-first responsive design framework    |
| **Database**      | MongoDB + Mongoose 9.1.5         | Flexible NoSQL persistence                   |
| **Payments**      | Razorpay 2.9.6                   | Secure transaction processing                |
| **Auth**          | JWT, Google Auth Library         | Stateless and secure user authentication     |
| **Messaging**     | MSG91, Nodemailer                | Multi-channel communication                  |
| **Visualization** | Recharts 3.7.0                   | Interactive admin/vendor data dashboards     |
| **Testing**       | Jest, Supertest                  | API integration and unit testing framework   |

---

## 📁 Project Structure

```text
pahadigo/
├── src/
│   ├── app/                  # Next.js App Router (UI & API Handlers)
│   │   ├── (website)/        # Public-facing traveller pages
│   │   ├── admin/            # Admin Interface (Protected)
│   │   └── api/              # API Route Handlers (NextJS endpoints)
│   ├── core/                 # Business Logic & Infrastructure (SOA)
│   │   ├── Controllers/      # API Controllers
│   │   ├── Services/         # SOA Logic (Auth, Booking, OCR, etc.)
│   │   ├── Models/           # Mongoose Schemas (17+ Models)
│   │   ├── Database/         # DB Configuration & Seeders
│   │   ├── Helpers/          # Utility functions (JWT, Responses)
│   │   └── Config/           # App-wide configurations
│   ├── components/           # UI Components (Client/Server)
│   └── hooks/                # Custom React Hooks
├── public/                   # Static assets & icons
└── tests/                    # Jest & Supertest suites
```

---

## ⚙️ Setup & Installation

### 1. Requirements

- Node.js 20+
- MongoDB Atlas (or local instance)
- API Keys for Razorpay, Cloudinary, MSG91 (optional for local dev)

### 2. Configure Environment

Clone `.env.example` to `.env` and fill in your credentials:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/pahadigo
JWT_SECRET=your_super_secret_jwt_key
RAZORPAY_KEY_ID=your_razorpay_key
CLOUDINARY_URL=your_cloudinary_url
SMTP_PASS=your_smtp_password
```

### 3. Initialize & Run

```bash
# Install dependencies
npm install

# Seed the database (creates initial categories & settings)
npm run seed

# Run the test suite to ensure system integrity
npm run test

# Start the development server
npm run dev
```

---

## 📄 Core Documentation

> [!NOTE]
> We maintain comprehensive developer documentation in the repository root.

- **[API Documentation](API.md)**: Detailed endpoints, request schemas, and responses.
- **[Architecture Guide](ARCHITECTURE.md)**: Deep dive into our Service-Oriented Architecture and data flow.
- **[Contributing Guidelines](CONTRIBUTING.md)**: How to submit PRs and code standards.
- **[Security Policy](SECURITY.md)**: Details on responsible disclosure and supported versions.

---

## ⚖️ License

Distributed under the [MIT License](LICENSE.md). See `LICENSE.md` for more information.
