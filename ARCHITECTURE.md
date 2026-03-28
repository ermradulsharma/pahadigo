# 🏗️ System Architecture & Data Orchestration

## 🏔️ 1. Domain Philosophical Core

**PahadiGo** is engineered as a **Service-Oriented Architecture (SOA)** encapsulated within the **Next.js 16 App Router** ecosystem. The architecture strictly enforces a unidirectional dependancy graph:

`Ingress (API/UI) → Controllers → Services → Models → Persistence (MongoDB)`

### Abstracted Kernel Design

Unlike standard Next.js applications, PahadiGo decouples the **Next.js App Ingress** from the **Business Logic Kernel**. All heavy mutations, third-party integrations (Razorpay, MSG91), and complex validation routines reside in the `src/core` directory, which is agnostic of the specific HTTP presentation layer.

---

## 🚦 2. Request & Information Lifecycle

Every packet traversing the PahadiGo environment follows a rigid, audited lifecycle to ensure transactional integrity.

### A. Presentation Layer (Ingress)

- **Public Website (`/(website)`)**: Uses React Server Components (RSC) with aggressive ISR (Incremental Static Regeneration) for lightning-fast catalog browsing.
- **Admin Dashboard (`/admin`)**: A high-security, client-driven React environment for real-time telemetry and management.
- **API Boundary (`/api`)**: Acts as a lightweight proxy, extracting payloads and handing them off to the `src/core/Http/Controllers`.

### B. Controller Layer

Controllers are responsible for:

1. **Payload Validation**: Strictly enforcing **Zod schemas** before any logic executes.
2. **DTO (Data Transfer Object) Mapping**: Sanitizing inputs for the service layer.
3. **Standardized Responses**: Using the `Helper` library to return unified JSON structures (`OK`, `BAD_REQUEST`, etc.).

### C. Service Layer (The Engine)

Services handle the "Grand Orchestration". They interact with:

- **AuthService**: Manages JWT generation, session boundaries, and social OAuth logic.
- **PaymentService**: Handles Razorpay order creation and asymmetric webhook verification.
- **PackageService**: Navigates the complex polymorphic package structures.

---

## 📊 3. Data Modeling & Polymorphism

PahadiGo utilizes **Mongoose Discriminators** to manage the heterogeneous nature of Himalayan travel products.

### Polymorphic Package Graph

The `Package` model acts as a base class, with specialized schemas for:

- **`Trekking`**: Includes altitude profiles, difficulty gradients, and equipment requirements.
- **`Homestay`**: Focuses on room-types, meal-policies, and local view-points.
- **`Rafting/Aadventure`**: Includes safety certifications and water-grade classifications.

### Persistence Strategy

- **Indexing**: All high-traffic paths (Search, Filter, Booking) utilize compound indexes on MongoDB to maintain O(1) or O(log N) lookup speeds.
- **Audit Logging**: Destructive actions are intercepted and stored in the `AuditLog` collection, providing a non-nullable history of administrative changes.

---

## 🛡️ 4. Security Infrastructure

- **Middleware Guarding**: Edge-compatible middleware evaluates JWT signatures at the routing boundary, dropping unverified packets before they hit the Node.js runtime.
- **OCR Pipeline**: Utilizing `Tesseract.js` on the server-side to extract text from Vendor IDs (Aadhar/PAN), which are then cross-referenced with profile data for automated KYC.
- **Environment Isolation**: A cached configuration system (`getAppConfig`) ensures that secrets are never leaked into the client bundle and are refreshed securely.

---

## 📡 5. Communication Hub

The platform leverages a tiered notification strategy:

1. **Transactional (SMS)**: Powered by **MSG91** for mission-critical OTPs and booking confirmations.
2. **Notification (Email)**: Orchestrated via **NodeMailer** for detailed invoices and policy updates.
3. **Real-time (Push)**: Utilizing **Firebase Cloud Messaging (FCM)** for vendor alerts and traveler engagement.

---

## 🧪 6. Technical Quality Control

- **Headless Testing**: Every Controller and Service is evaluated against a mock MongoDB instance (`mongodb-memory-server`) using **Jest**.
- **Static Analysis**: ESLint 9.x maintains a strict recursive analysis of the `src/core` kernel to prevent logic leaks and ensure coding consistency.
