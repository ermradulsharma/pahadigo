<p align="center">
  <img src="public/img/pahadigo_banner.png" alt="PahadiGo Banner" width="100%" />
![Next.js](https://img.shields.io/badge/Next.js-16.2.x-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.x-blue?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_9.x-green?style=for-the-badge&logo=mongodb)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.1-teal?style=for-the-badge&logo=tailwind-css)
![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg?style=for-the-badge)

</p>

---

## 🏔️ System Vision & Domain Scope

**PahadiGo** is a highly scalable, multi-tenant B2B2C marketplace infrastructure engineered specifically for Himalayan experiential travel, adventure logistics, and remote accommodation management. Built with enterprise-grade isolation and modularity, the platform provides a rigorous digital bridge between global travelers and localized service providers (vendors).

The system guarantees transactional safety through distributed lock mechanisms, strict automated KYC verifications (via serverless OCR pipelines), and atomic financial ledger mutations. The codebase employs a sophisticated **Service-Oriented Architecture (SOA)** under the hood of Next.js App Router, completely decoupling HTTP ingress routing from deeper Node.js/Mongoose domain states.

---

## 🚀 Architectural Capabilities

### 🛡️ Cryptographic Identity & Vendor Compliance

- **Multi-Modal Auth Strategy:** Passwordless JWT orchestration leveraging Time-based One-Time Passwords (TOTP) transmitted via **MSG91** (SMS) and **Nodemailer** (Email), harmonized safely with OAuth 2.0 Identity Providers (Google, Facebook, Apple).
- **Automated AI KYC Validation:** Specialized OCR Pipelines utilizing `Tesseract.js` evaluate uploaded Aadhar and PAN representations via Cloudinary buffer streams, performing text extraction to establish a mathematically verified `Vendor Identity` graph in real-time.
- **Role-Based Access Control (RBAC):** Extensible Edge Middleware rigorously evaluates JWT signatures against targeted API scopes (`Traveller`, `Vendor`, `Admin`), dropping unauthorized physical connections prior to Node.js application bootstrapping.

### 💼 High-Performance Marketplace & Polymorphic Inventory

- **Polymorphic Data Models:** A unified `Package` collection mapped against highly dynamic Mongoose Discriminators allows distinct entities (`Homestay`, `Trekking`, `Chardham`, `Rafting`) to inherit base structures while enforcing completely heterogeneous nested schema arrays.
- **Transactional Booking Engine:** State allocations implement native MongoDB Session boundary transactions executing `$inc` decrement operations. This mathematically neutralizes massive-scale race conditions and double-booking concurrency vectors during peak operational load.
- **Financial Ledger & State Synchronization:** Complete **Razorpay** checkout lifecycle mapping utilizes asymmetric HMAC signature verification, facilitating split-payout state machines and immutable refund processing histories natively.

### 📈 Global Administration Command Center & Premium UX

- **Dynamic Glassmorphic Telemetry:** Aggregated geographical heatmaps and real-time revenue matrices execute through `Recharts`, styled explicitly inside fluid, micro-animated `framer-motion` containment grids for enterprise-grade data legibility.
- **Immutable Audit Trails:** A non-destructive internal `AuditLog` subsystem passively intercepts administrative mutations, providing unforgeable historical context logs for every destructive (`PATCH`, `DELETE`) command issued by SuperAdmins.

---

## 🛠️ Technology Stack & Dependencies

### Frameworks & Presentation UI

- **Framework & Routing:** `Next.js 16.2.x` (Full App Router Adoption / Edge Runtime capabilities)
- **UI & State Synthesis:** React 19.x utilizing highly optimized React Server Component (RSC) limits alongside `framer-motion` for complex physics-based orchestration.
- **Styling Execution:** `Tailwind CSS 4.x` executing strictly alongside modernized PostCSS hooks and `lucide-react` dynamically scaling SVGs.
- **Data Visualization Canvas:** `Recharts 3.x` mapping server-cached telemetry payloads visually.

### Backend Orchestration & Persistence

- **Runtime Virtual Machine:** Node.js `20.x+` leveraging ES Modules (ESM) completely.
- **Object Data Modeling:** `Mongoose 9.x` structured securely across heavily indexed MongoDB databases.
- **Cloud Blob Computing:** `Cloudinary` optimized via `next-cloudinary` acting as CDN and binary image transformation engine.
- **Machine Vision Processing:** Native `Tesseract.js` backing server-side Document OCR metadata extraction globally.

### DevOps, Quality Control & Security

- **Integration Test Topologies:** Full CI automation capabilities resolving functional specifications via `Supertest` mapping to isolated `mongodb-memory-server` DB shards exclusively evaluated by `Jest`.
- **Automated CI/CD Workflows:** Native GitHub Actions pipelines execute autonomous multi-platform linting, Dependabot resolutions, and security environment blocks proactively before main-branch synchronization.
- **Static Analysis & Linting:** Strict reactive typing and syntax enforcement powered by next-generation flat `eslint` configurations.

---

## 📁 Repository Structure Matrix

```text
pahadigo/
├── src/
│   ├── app/                  # Next.js Presentation & Ingress routing boundary
│   │   ├── (website)/        # Public-facing SSG/ISR cached traveller hubs
│   │   ├── admin/            # High-security Client-Side Rendered dashboards
│   │   └── api/              # Restful JSON API endpoints mapping HTTP traffic to Controllers
│   ├── core/                 # Abstracted Domain Business Logic (SOA Kernel)
│   │   ├── Controllers/      # Request parsing, payload validation, Response serialization
│   │   ├── Services/         # Heavy state modifications, transactions, and Gateway integrations
│   │   ├── Models/           # Deeply indexed Mongoose structural architectures
│   │   ├── Database/         # Bootstrap execution scripts and global environment Seeders
│   │   ├── Helpers/          # Cryptography wrappers, FormData edge parsers, Response handlers
│   │   └── Config/           # Runtime execution variables and Global DB connection polling
│   └── components/           # Reusable functional UI Atoms/Molecules (React)
├── tests/                    # Integration & Controller testing mock configurations
├── docs/                     # Technical documentation, architectural specs, and references
├── scripts/                  # Development scripts, database migrations, and Postman collections
├── public/                   # Binary Web App static assets mapping directly to Next.js ingress
└── ...
```

---

## ⚙️ Developer Environment Bootstrap

### 1. Prerequisite Toolchain

- **Node.js**: `v20.0.0` or higher
- **MongoDB**: Active local `mongod` replica set OR remote MongoDB Atlas Cluster URI.
- **Integration Credentials** (Required for localized transaction/communication tests): Razorpay API, Cloudinary URL, and MSG91 Sandbox thresholds.

### 2. Environment Configurations

**All suspected penetrations or anomalies MUST be reported directly to Er. Mradul Sharma.**
Clone `.env.example` directly into `.env` at the repository root and align secrets:

```env
# Persistence Mapping
MONGODB_URI=mongodb://localhost:27017/pahadigo_dev

# Cryptographic Keys (Execute strict 256-bit Hex Generations)
JWT_SECRET=enter_highly_secure_generated_sha_key_here

# Required Ecosystem Gateways
CLOUDINARY_URL=cloudinary://<public_key>:<secret>@<cloud_name>
RAZORPAY_KEY_ID=your_test_key_id
SMTP_HOST=smtp.sandbox.mail
```

### 3. Execution Protocols

```bash
# 1. Resolve deterministic dependency trees cleanly
npm install

# 2. Reset database state and strictly initialize internal requirements (Roles, Admins, Locations)
npm run seed

# 3. Assert architecture stability operating internal Jest test integrations
npm run test

# 4. Boot localized development environment resolving HMR modifications dynamically
npm run dev
```

---

## 📚 Technical Documentation Hub

This repository possesses comprehensive sub-documentation manuals standardizing structural execution methodologies. It is imperative that contributing engineers consume these parameters entirely:

- **[CHANGELOG.md](docs/CHANGELOG.md)** — History of platform updates and version releases.
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — Detailed technical design, data modeling, and system orchestration.
- **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** — Full specification of available API routes and protocols.
- **[DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** — Deep dive into Mongoose models and polymorphic service structures.
- **[BACKEND_OPERATIONS.md](docs/BACKEND_OPERATIONS.md)** — Operational mechanics, SOA kernel, and routing lifecycle.
- **[FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md)** — UI/UX design synthesis, Next.js App Router, and Framer Motion.
- **[TESTING_SETUP.md](docs/TESTING_SETUP.md)** — Automated quality control, Jest integration, and memory-DB isolation.
- **[SECURITY.md](docs/SECURITY.md)** — Authentication matrices, NoSQL injection parameters, and Coordinated Disclosure.
- **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** — Workflow standards, testing protocols, and dependency management.


---

## ⚖️ License & Intellectual Property

The **PahadiGo** source code repository is a **Private Project** and operates strictly under a [Proprietary License](LICENSE.md). Copyright © 2024-2026 **Er. Mradul Sharma**. Unauthorized redistribution is strictly prohibited.
