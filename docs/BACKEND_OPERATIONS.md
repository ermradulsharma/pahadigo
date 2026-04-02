# ⚙️ PahadiGo Backend Infrastructure & SOA Kernel

**Architecture Type:** Service-Oriented (SOA) with Controller-Service-Repo Pattern.
**Runtime Engine:** Next.js Server Components + Custom Route Handler (`src/app/api`).

This document provides a deep dive into the operational mechanics of the PahadiGo backend, explaining how requests are processed, validated, and logged.

---

## 🚦 1. Request Lifecycle Overview

PahadiGo implements a custom routing engine that intercepts Next.js requests and maps them to standard Node.js Controllers.

1.  **Ingress:** `src/app/api/[...slug]/route.js` captures all `/api/*` traffic.
2.  **DB Pre-shaking:** Establishes a MongoDB connection (`dbConnect`).
3.  **Routing:** Matches the URL and Method against `src/core/Routes/api.js`.
4.  **Middleware Pipeline:**
    - `RateLimit`: Prevents brute-force on sensitive Auth paths.
    - `AuthMiddleware`: Validates JWT/Security Context.
    - `RoleMiddleware`: Enforces RBAC (`traveller`, `vendor`, `admin`).
    - `Validation`: Executes **Zod schemas** on incoming Json/FormData.
5.  **Controller Handoff:** Calls the matched method in `src/core/Controllers`.
6.  **Service Orchestration:** Controllers invoke `src/core/Services` for business logic (DB mutations, external API calls like Razorpay).
7.  **Auto-Audit:** `apiHandler` interceptor passively logs state changes to the `AuditLog` collection.

---

## 🛠️ 2. Core Components

### A. Controllers (`src/core/Controllers`)
- **Duty:** Entry point for requests.
- **Rule:** Never perform direct database mutations.
- **Output:** Returns standardized JSON responses using the `response.js` helper.

### B. Services (`src/core/Services`)
- **Duty:** The "Business Brain" of the application.
- **Examples:**
    - `AuthService`: Handles JWT generation, password hashing, and OTP expiration.
    - `RazorpayService`: Manages transactional signatures and orders.
    - `PackageService`: Navigates the complex polymorphic Mongoose queries.

### C. Helpers & Utilities (`src/core/Helpers`)
- `apiHandler.js`: The primary wrapper for controller methods.
- `validation.js`: Contains all Zod schemas for input consistency.
- `security.js`: Handles NoSQL injection sanitization and PII/Sensitive data redaction.
- `parseNestedFormData.js`: Converts complex multipart/form-data (used in document uploads) into structured JSON objects.

---

## 🔐 3. Security Hardening

- **JWT Stateless Auth:** Tokens are evaluated in the Next.js Edge-compatible middleware for high-performance session validation.
- **NoSQL Injection Guard:** Every request body is sanitized before reaching the Controller.
- **Form-Data Standardization:** For file uploads (KYC/Aadhar), the system uses a unified buffer-handling strategy to prevent temp-file leaks.

---

## 📊 4. Auto-Audit Subsystem

When a mutation occurs (POST/PATCH/DELETE), the `apiHandler` automatically extracts significant metadata:
- **Logical Action:** `CREATE`, `UPDATE`, `DELETE`.
- **Target Entity:** Dynamically inferred from the URL (e.g., `VENDOR`, `PAYMENT`).
- **Payload:** A redacted snapshot of the incoming data, excluding passwords or sensitive tokens.
- **Performer:** The `req.user.id` from the Auth context.

This audit trail ensures all administrative changes are immutable and accountable.
