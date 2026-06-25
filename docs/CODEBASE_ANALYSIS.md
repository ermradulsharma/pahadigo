# PahadiGo Codebase Analysis

## 1. Executive Summary

PahadiGo is a Next.js 16 and Node.js travel marketplace focused on Himalayan travel, adventure packages, accommodation, vendor operations, and traveller booking flows. The project uses the Next.js App Router for the web layer and a service-oriented backend kernel under `src/core` for domain logic.

The backend is organized around a custom route manifest, controller wrappers, role-based middleware, Mongoose models, and role-specific services for Admin, Vendor, Traveller, General, and Auth workflows. MongoDB is the primary persistence layer, Razorpay handles payments, Cloudinary handles media storage, MSG91/Nodemailer support OTP and email flows, and Firebase/FCM supports push notifications.

## 2. Technology Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4, Framer Motion, Recharts, Lucide React |
| Runtime | Node.js with ES Modules |
| Database | MongoDB with Mongoose 9 |
| Auth | JWT, OTP, social login integrations |
| Payments | Razorpay |
| Media | Cloudinary and next-cloudinary |
| OCR/KYC | Tesseract.js |
| Notifications | Firebase Admin, Nodemailer, MSG91 |
| Testing | Jest, Supertest, mongodb-memory-server |
| Quality | ESLint flat config |

## 3. High-Level Architecture

The project follows a layered architecture:

```text
Next.js App Router
  -> src/app/api/[...slug]/route.js
  -> src/core/Routes/api.js
  -> src/core/Routes/{Public,Auth,Admin,Vendor,Traveller}
  -> src/core/Http/Controllers/*
  -> src/core/Services/*
  -> src/core/Models/*
  -> MongoDB / external gateways
```

### Key Architectural Characteristics

- Single catch-all API endpoint dispatches all backend requests.
- Modular route manifests group paths by domain and role.
- Controllers remain thin and delegate business rules to services.
- Services contain booking, inventory, KYC, payment, profile, policy, and admin workflows.
- Mongoose models define the core domain objects and indexes.
- Middleware handles authentication, optional authentication, role checks, request sanitization, rate limiting, and validation.

## 4. Repository Structure

| Path | Responsibility |
| --- | --- |
| `src/app` | Next.js app pages, layouts, API entrypoint, admin UI, public website, traveller UI |
| `src/app/api/[...slug]/route.js` | Universal API dispatcher for all REST-like backend routes |
| `src/core/Routes` | Custom route manifest, grouping helper, role-specific route modules |
| `src/core/Http/Controllers` | Request handlers split by Admin, Auth, General, Traveller, and Vendor domains |
| `src/core/Services` | Business logic and integration workflows |
| `src/core/Models` | Mongoose schemas for users, vendors, bookings, packages, inventory, reviews, policies, disputes, etc. |
| `src/core/Models/PackageSchemas` | Category-specific package schemas such as Homestay, Hotel, Trekking, Rafting, Vehicle Rental, and Chardham Tour |
| `src/core/Helpers` | Shared utilities for auth, responses, parsing, validation, location, security, pricing, availability, and Cloudinary |
| `src/core/Http/Middleware` | Auth, role, and rate-limit middleware |
| `src/core/Config` | Database connection setup |
| `src/core/Constants` | Domain constants, roles, statuses, response messages, app settings |
| `tests` | Unit and integration tests for models, routes, and services |
| `public` | Static assets |

## 5. API Request Lifecycle

All API traffic flows through `src/app/api/[...slug]/route.js`.

1. Connects to MongoDB using cached Mongoose connection logic.
2. Resolves route by HTTP method and slug path.
3. Applies auth rate limiting for sensitive auth routes.
4. Runs auth middleware for protected routes and optional auth for public package browsing.
5. Applies role middleware for Admin, Vendor, and Traveller areas.
6. Parses JSON, multipart form data, or URL-encoded bodies.
7. Sanitizes JSON payloads against NoSQL injection patterns.
8. Validates request data when a route schema exists.
9. Executes wrapped controller method via centralized API handler.
10. Returns standardized success or error response helpers.

## 6. Route Modules

### Public Routes

Public routes expose package browsing, categories, geography, policies, inquiries, and Razorpay webhook handling.

Important route groups:

- `/packages` with optional auth for browsing, search, and details.
- `/categories` for public taxonomy access.
- `/countries` and `/states` for geography.
- `/vendor/*` and `/traveller/*` policy endpoints.
- `/payment/webhook` for payment gateway callbacks.

### Auth Routes

Auth routes support OTP, token verification, token refresh, local login, social auth, forgot password, and logout.

Important route groups:

- `/auth/otp`
- `/auth/verify`
- `/auth/refresh`
- `/auth/login`
- `/auth/google`
- `/auth/facebook`
- `/auth/apple`
- `/auth/forget-password`
- `/auth/logout`

### Admin Routes

Admin routes are protected with auth middleware and Admin role checks. They provide platform governance and operational control.

Major capabilities:

- Dashboard stats, analytics, and audit logs.
- Admin profile and password management.
- Traveller and vendor management.
- Vendor approval and document verification.
- Package moderation and management.
- Booking, payout, and refund workflows.
- Review, dispute, inquiry, marketing, coupon, category, policy, setting, country, and state management.

### Vendor Routes

Vendor routes are protected with auth middleware and Vendor role checks.

Major capabilities:

- Vendor profile and FCM token management.
- Business profile lifecycle.
- Business and category document upload.
- Category eligibility and requirement checks.
- Bank details management.
- Package and item management.
- Booking status and OTP verification.
- Inventory and baseline price updates.
- SOS and chat workflows.

### Traveller Routes

Traveller routes are protected with auth middleware and Traveller role checks.

Major capabilities:

- Traveller profile, role upgrade to vendor, emergency contacts, and FCM token.
- Booking initiation, cancellation, dispute creation, payment initialization, and payment verification.
- Booking OTP retrieval.
- Reviews, wishlist, recent searches, SOS, profile image, and chat workflows.

## 7. Domain Model Overview

### User

The User model stores identity, authentication, profile, emergency contacts, address, preferences, role, status, OTP metadata, FCM token, vendor relation, and soft-delete metadata.

Important behavior:

- Passwords are hashed using bcrypt before save.
- Email, phone, Google ID, Facebook ID, and Apple ID use unique partial indexes.
- Role and status fields are indexed.
- Address location uses a 2dsphere index.

### Vendor

The Vendor model stores vendor/business profile details, approval status, operating status, category assignments, address, bank details, KYC documents, OCR metadata, and soft-delete metadata.

Important behavior:

- Vendor is uniquely linked to a User.
- Vendor address uses a 2dsphere index.
- KYC document status uses verification status constants.

### Package

The Package model is a vendor catalog container. A single vendor package document stores arrays for multiple category-specific schemas:

- Homestay
- Hotel
- Camping
- Trekking
- Rafting
- Bungee Jumping
- Vehicle Rental
- Chardham Tour
- Custom Trip

Important behavior:

- User and vendor references are unique.
- Package titles and names are indexed with a compound text index.
- Different package types use separate nested schemas under one catalog document.

### Booking

The Booking model captures the full reservation lifecycle.

Important fields:

- Traveller, vendor, package, and item references.
- Occupancy, guest details, dates, and pricing.
- Payment gateway details, Razorpay order/payment/signature fields.
- Payout snapshot and vendor bank details.
- Start and end OTP verification.
- Timeline events and cancellation metadata.

Important behavior:

- Status and payment status use constants and indexes.
- Item ID and created date are indexed.
- Booking timeline provides audit-like operational history.

### Supporting Models

The codebase also includes models for categories, category documents, inventory, reviews, wishlist, conversations, chat messages, disputes, inquiries, emergency alerts, policies, settings, coupons, banners, audit logs, countries, states, search logs, vendor closures, vendor documents, verified identities, and rate limits.

## 8. Business Workflows

### Authentication Flow

- Traveller and Vendor users primarily authenticate using OTP and social login.
- Admin users use local password authentication.
- JWT tokens carry user ID and role information.
- Middleware validates token signature, user status, soft deletion, and role authorization.
- Temporary role switching is supported via user preferences.

### Vendor Onboarding Flow

- User upgrades or signs up as a vendor.
- Vendor creates business profile.
- Vendor uploads business documents and category-specific documents.
- Admin verifies documents and can trigger OCR processing.
- Admin approves vendor once compliance requirements are met.
- Vendor manages packages, inventory, closures, bank details, and booking operations.

### Package and Inventory Flow

- Vendors create and manage category-specific package items.
- Package data is stored under a vendor catalog document.
- Inventory services check availability by item, category, date range, and units.
- Baseline pricing and inventory updates are exposed through Vendor routes.
- Public users browse and search packages, including nearby search support.

### Traveller Booking Flow

- Traveller initiates booking for a package item.
- Booking service calculates dates, nights, occupancy, unit requirements, pricing, tax, and service fee.
- Inventory is checked before booking creation.
- Booking is created inside a MongoDB transaction.
- Final availability check runs inside the same transaction to reduce race conditions.
- Payment is initialized through Razorpay.
- Payment verification confirms the booking, stores payment IDs, and generates start/end OTPs.
- Start OTP begins the trip; End OTP completes the trip.
- Cancellation marks booking as cancelled and refund pending when applicable.
- Traveller can raise disputes and submit reviews.

### Admin Operations Flow

- Admin dashboard aggregates platform statistics.
- Admin manages travellers, vendors, packages, policies, settings, categories, documents, marketing banners, coupons, inquiries, reviews, disputes, payouts, and refunds.
- Audit and timeline structures support operational traceability.

## 9. Security Analysis

### Existing Security Controls

- JWT-based authentication middleware.
- Role-based access control for Admin, Vendor, and Traveller routes.
- Rate limiting on sensitive auth endpoints.
- NoSQL sanitization for JSON request bodies.
- Password hashing with bcrypt.
- Partial unique indexes for login identifiers.
- Soft-delete and blocked/suspended/deleted account checks.
- Razorpay signature verification for booking payments.
- KYC document verification and OCR support.

### Security Risks and Gaps

- Some constants include insecure development fallbacks such as `JWT_SECRET` defaulting to `test_secret`.
- Development payment bypass accepts `DUMMY_SIGNATURE` when `NODE_ENV=development`; this must never run in production-like environments.
- API error handler catches internal errors but currently hides server details without structured logging, making production incident analysis harder.
- Route schema validation exists, but not all routes appear to define request schemas.
- Rate limiting is persisted in MongoDB; it is durable but can become expensive under high-volume attack traffic without a TTL/index strategy.
- OTP generation uses `Math.random`; cryptographic random generation would be stronger for security-sensitive OTPs.

## 10. Reliability and Performance Analysis

### Strengths

- Mongoose connection is cached globally to avoid repeated connections during hot reload and serverless invocations.
- Booking creation uses MongoDB sessions and transactions.
- Package search has a compound text index.
- Frequently queried fields such as status, role, payment status, booking code, item ID, and geolocation are indexed.
- Tests cover many models, route helpers, route modules, and service modules.

### Risks

- Universal route matching loops through all route definitions for every request; acceptable at current scale but can be optimized with method/path maps.
- Large nested package documents may grow significantly for high-volume vendors.
- Some models delete existing Mongoose model definitions before export, while others use `mongoose.models.* || mongoose.model`; model registration strategy is inconsistent.
- MongoDB-backed rate limiting may become a bottleneck without TTL cleanup and indexes.
- Booking code generation uses random short strings and relies on unique index collision handling rather than retry logic.

## 11. Testing Coverage

The test suite includes coverage for:

- Mongoose models and package schemas.
- Route helper and route modules.
- Admin services.
- Vendor and traveller route modules.
- Public route module.

Recommended additions:

- End-to-end API tests for the catch-all API dispatcher.
- Booking concurrency tests for inventory conflict scenarios.
- Payment webhook and signature verification tests.
- Auth middleware and role-switching tests.
- Rate-limit TTL and cleanup behavior tests.
- Negative-path validation tests for all write-heavy endpoints.

## 12. Code Quality Observations

### Positive Patterns

- Clear domain separation by role and capability.
- Route definitions are declarative and grouped.
- Controller wrappers avoid circular dependency initialization issues.
- Services centralize business logic instead of placing it in route handlers.
- Constants provide a common vocabulary for statuses, roles, and messages.
- Helper modules keep cross-cutting concerns reusable.

### Improvement Areas

- Standardize import paths and extension usage; one Traveller route import omits `.js`.
- Standardize Mongoose model registration strategy.
- Add route schemas consistently for body validation.
- Replace security-sensitive random values with crypto-based generation.
- Add structured logging in catch blocks and boundary layers.
- Add retry logic for generated identifiers such as booking codes.
- Consider splitting very large route modules once route count increases further.

## 13. Suggested Roadmap

### Short Term

1. Enforce production-required secrets and remove insecure fallback secrets.
2. Replace OTP and booking-code randomness with Node.js crypto utilities.
3. Add validation schemas to all write endpoints.
4. Add TTL/index strategy for rate-limit records.
5. Add structured logging to API dispatcher, route wrapper, payment, and booking workflows.

### Medium Term

1. Optimize route matching with precompiled method/path maps.
2. Add integration tests for full API request lifecycle.
3. Improve booking conflict retry and collision handling.
4. Standardize model compilation across all schemas.
5. Add observability for payment, OCR, booking, and notification failures.

### Long Term

1. Consider extracting payment, notification, and OCR workflows into isolated service adapters.
2. Consider event-driven processing for notifications, OCR, audit logs, and refunds.
3. Add admin-visible operational health dashboards for external gateways.
4. Add formal API documentation generated from route manifests and validation schemas.
5. Evaluate document growth limits for vendor package catalog documents.

## 14. Overall Assessment

The codebase is a well-structured travel marketplace platform with a clear service-oriented backend design inside a Next.js application. Its strongest areas are role-based modularization, domain-rich Mongoose models, booking lifecycle design, and broad service/test organization. The most important hardening work should focus on security defaults, consistent validation, cryptographic randomness, route dispatch performance, structured logging, and concurrency/collision handling around bookings and payments.
