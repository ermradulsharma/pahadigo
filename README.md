# PahadiGo - Travel & Vendor Management System

PahadiGo is a full-stack Next.js application designed to manage travel packages, user bookings, and vendor profiles. It features a robust service-oriented architecture, secure authentication (OTP & Google OAuth), and integrated payments via Razorpay.

## 🚀 Features

- **Service Layer Architecture:** Clean separation of business logic from controllers.
- **Secure Authentication:**
  - OTP-based login (Email/Phone).
  - Google OAuth Integration.
- **Vendor Management:** Profile creation, category selection, and package management.
- **Booking System:** Domestic and International package bookings with status tracking.
- **Payment Integration:** Secure transactions via Razorpay.
- **Admin Dashboard:** Aggregated stats, vendor approval, and payout management.
- **Comprehensive Testing:** Unit and Integration tests for services and APIs.

## 🛠️ Tech Stack

- **Framework:** Next.js
- **Database:** MongoDB (Mongoose)
- **Styling:** Tailwind CSS
- **Authentication:** JWT, Google Auth Library
- **Payments:** Razorpay SDK
- **Testing:** Jest, Supertest, MongoDB Memory Server

## 📁 Project Structure

```text
src/
├── app/            # Next.js App Router & API routes
├── controllers/    # API Request Handlers (Thin Layer)
├── services/       # Core Business Logic (Service Layer)
├── models/         # Mongoose Schemas & Models
├── helpers/        # Utility helpers (JWT, etc.)
├── config/         # Database and third-party configs
└── middleware/     # Auth and Role-based middleware
tests/
├── unit/           # Service-level unit tests
├── api/            # Controller-level integration tests
└── setup.js        # Global test environment configuration
```

## ⚙️ Setup Instructions

### 1. Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas)

### 2. Environment Variables

Create a `.env` file in the root directory and add the following:

```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
RAZORPAY_KEY_ID=your_razorpay_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Installation

```bash
npm install
```

### 4. Running the App

```bash
npm run dev
```

### 5. Running Tests

```bash
npm test
```

## 🧪 Testing Suite

We use Jest for automated testing. Tests are performed against an isolated in-memory MongoDB server to ensure a clean state and avoid side effects.

- **Unit Tests:** `npm test -- tests/unit`
- **Integration Tests:** `npm test -- tests/api`

## 🤝 Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License.
