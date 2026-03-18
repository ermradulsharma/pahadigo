# 📡 System Communication Interfaces (API)

The PahadiGo infrastructure relies upon a RESTful JSON standard explicitly modeled against robust domain services. HTTP execution is decoupled from logic instantiation, providing uniform response structures universally. By standardizing communication, front-end contexts and external integrators can cleanly anticipate uniform error representations and deterministic data schemas.

---

## 🔒 1. Cryptographic Identity Endpoints
These endpoints manage passwordless authentication tokens, session verification, and strict Authorization headers mappings natively.

| HTTP Method | Route Interface | Role Requirement | Execution Result |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/token/request` | `Public` | Generates & dispatches OTP constraints via MSG91/Nodemailer targets securely. |
| `POST` | `/auth/token/verify` | `Public` | Consumes OTP string, allocating asymmetric physical Auth JWTs mapping to users. |
| `POST` | `/auth/oauth/google` | `Public` | Direct Google Identity mapping verifying active RSA Signatures dynamically. |
| `PATCH`| `/auth/profile/update` | `User/Vendor` | Mutates attached identity parameters utilizing valid authorization headers. |

*(All valid authenticated sessions return an explicit `token` alongside a strict `user.role` object required for frontend React Context propagation).*

---

## 🏞️ 2. Booking Engine & Inventory Transactions
Handles atomic transactions guaranteeing safe ledger mapping without race condition collisions.

| HTTP Method | Route Interface | Role Requirement | Execution Result |
| :--- | :--- | :--- | :--- |
| `GET` | `/package/inventory/all` | `Public` | Aggregates polymorphic Mongoose discriminators into filtered generic arrays. |
| `GET` | `/package/inventory/:id` | `Public` | Retrieves exact structured taxonomy data for distinct inventory objects. |
| `POST`| `/booking/reserve/init` | `User` | Allocates temporary DB lock mechanisms preventing parallel inventory exhaustion. |
| `POST`| `/booking/payment/webhook` | `Internal` | Razorpay HMAC strict verification mapping immutable success to DB ledgers. |

*(Inventory states utilize native Mongoose '$inc' parameters executing heavily clustered locking structures dynamically).*

---

## 💼 3. B2B Vendor Management Topologies
The `VendorController` intercepts and navigates fiercely complex identity profiles, deeply integrated documentation uploads, and dynamic marketplace listings explicitly.

### KYC & Business Ledgers
- `POST /vendor/business/profile/create`: Ingests massive schema graphs constructing native vendor identities explicitly.
- `PATCH /vendor/business/profile/update`: Edits minor parameters effectively.
- `POST /vendor/business/documents/upload`: Safely processes file attachments translating binary components into assets directly.

### Polymorphic Catalog Schema Registration
Vendor inventory handles differing subschemas correctly. Base constraints matching dynamic internal logic dictates subschemas.

---

## 🛠️ 4. Global Admin Control Structures
Highly guarded route layers executing massive systemic configuration alterations. Only strictly secured super-admin identities can access these topological mutation end-points. 

- `DELETE /admin/vendor/suspend/:id`: Instantiates an application-wide session invalidation protocol locking target vendor execution completely.
- `PATCH /admin/category/taxonomy/sync`: Forces live synchronization mapping deep UI nested structures universally.
- `GET /admin/telemetry/revenue`: Queries comprehensive metrics computing direct visualization payload variables. 

*(Administrative calls trigger passive Internal Logging schemas natively maintaining immutable execution traces).*
