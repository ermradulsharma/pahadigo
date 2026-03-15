# 🛡️ PahadiGo Security Protocol

The PahadiGo development team takes the profound responsibility of securing our users, travel vendors, and their financial transactions with the utmost seriousness. Because we manage real bookings, verified identification (Aadhar/PAN via AI OCR), and Razorpay payments, adhering to ruthless security protocols is strictly mandatory.

---

## 📅 1. Supported Versions

We only provide critical security patches for the latest stable major release of the platform ecosystem. Please guarantee your production environment executes the latest tag.

| Platform Version | Status             | End of Support |
| :--------------- | :----------------- | :------------- |
| `1.x.x`          | ✅ Maintained      | TBD            |
| `< 1.0.0`        | ❌ Untested (Beta)  | Now            |

---

## 🦠 2. Reporting a Vulnerability

**DO NOT** report critical or severe security vulnerabilities to the public issue tracker. We employ a coordinated disclosure workflow.

If you firmly believe you have discovered a vulnerability related to:
* JWT Token hijacking or session replay.
* NoSQL Injection vectors circumventing Next.js parsing or Mongoose hooks.
* Multi-tenant data segregation anomalies (Vendor A seeing Vendor B's ledger).
* Server-Side Request Forgery via our Cloudinary OCR integration.
* Unauthorized access to the Super Admin route hierarchies.

Please confidentially email us at **security@pahadigo.com**.

### Incident Response SLA ⏱️
* **Triage**: 48 Hours.
* **Confirmation & Patch Drafting**: 1 to 5 Business Days.
* **Coordinated Release**: Typically within 14 Days, alongside a formal security advisory.

When emitting an email, please diligently provide:
* The precise attack vector and payload.
* Reproducible steps against a strictly **local** or **test** environment.
* Potential impact scope.

---

## 🔒 3. System Security Features

### 3.1 Authentication & AuthZ
* **Stateless Validation**: Zero server-side session cookies mapping session data. We strictly utilize brief JWT Access Tokens encrypted using `.env` secrets.
* **Role-Based Guards**: Native Next.js Edge Middleware rigorously guards the `(admin)/*` router tree and enforces context mapping.

### 3.2 Anti-Injection and Sanitization
* **Mongoose Native Safeties**: All database execution utilizes parameterized Mongoose bindings.
* **NoSQL Shield**: We utilize deep parsing validators before API execution inside the controller layers to intercept malformed object injections.
* **Edge Validation**: Re-sanitization of multipart form data utilizing Node boundary isolation before memory offloading to Cloudinary.

### 3.3 Finance & Verification Security
* **Razorpay HMAC Signatures**: Total decoupling from CC processing. Critical payload signature verification executes explicitly before logging `Payment Success`.
* **Vendor Identity**: OCR buffers are exclusively transported over TLS, memory purged aggressively post-analysis, and persisted directly to isolated VerifiedIdentity tables, never accessible to standard Vendor GET requests.

---

## 🚨 4. Automated Scanning

PahadiGo implements strictly mandated automated CI/CD pipeline scans covering:
1. `npm audit` lockfile interceptors.
2. CodeQL for logic vulnerabilities and implicit trusts.
3. Secret-scanning to guarantee zero `JWT_SECRET` leaks into the remote repository.

Thank you profoundly for collaborating to keep the Himalayan eco-travel infrastructure resilient.
