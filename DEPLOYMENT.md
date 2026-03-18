# 🚀 High-Availability Deployment Architecture

Deploying PahadiGo requires an understanding of Next.js 15+ execution constraints, particularly when blending Serverless edge functions with a long-running Node.js Service-Oriented Architecture (SOA) state boundary.

This manual outlines deterministic deployment pathways designed for high-availability, caching, and database connection stability.

---

## ☁️ 1. Edge-Native Vercel Architectures (Strict Recommendation)

Vercel natively optimizes Next.js execution parameters. It parses Server Components automatically and configures optimal routing logic, image caching, and Edge Middleware seamlessly.

### Mandatory Environment Initialization
Ensure the following variable mappings are instantiated globally in the Vercel Project Settings:
- `MONGODB_URI`: Native connection string (Always use the `mongodb+srv://` Atlas protocol).
- `JWT_SECRET`: A strictly secure, randomly generated 256-bit Hex key for JWT/TOTP generation.
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Live keys for the production checkout pipeline.
- `CLOUDINARY_URL`: Full formatted cloudinary connection URI.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Valid email transport limits.
- `MSG91_AUTH_KEY`: Active token for transactional SMS capabilities.

### ⚠️ Critical Component: Connection Polling Isolation
Next.js `src/app/api` nodes execute as stateless Serverless Functions. Executing aggressive Mongoose reconnections on every HTTP request will rapidly exhaust MongoDB Atlas Connection Pools (causing 503 errors). 
PahadiGo solves this internally via `src/core/Config/db.js`, which caches the database connection mapping to the `global` Node namespace. No external PM2/PGBouncer-style database proxy is directly required.

---

## 🐋 2. Thread-Level Multiprocessing (EC2 / VPS / PM2)

If deploying to a raw Virtual Private Server (Ubuntu/Debian) or AWS EC2, you must employ PM2 or Docker to keep the Node.js daemon alive and actively restart on fatal crashes.

### PM2 Ecosystem Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'pahadigo-production',
      script: 'npm',
      args: 'start',
      instances: 'max', // Leverages Node cluster module across all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

1. Secure the server via `Nginx` as a reverse proxy targeting `localhost:3000`.
2. Terminate SSL (HTTPS) natively at the Nginx block using standard `Certbot` Let's Encrypt protocols.
3. Keep static `.next/` cache folders preserved between builds to retain ISR functionality.

---

## 🔄 3. Continuous Integration & Deployment (CI/CD)

PahadiGo implements a rigorous automated execution matrix powered by **GitHub Actions**.

Whenever a commit is pushed to the `main` or `staging` branch:
1. The **Testing Pipeline (`ci.yml`)** provisions a virtual Ubuntu environment.
2. An isolated `mongodb-memory-server` is instantiated.
3. The Jest integration suite evaluates core controllers (`VendorService`, `AuthService`, `BookingService`, etc.).
4. Only upon successful evaluation and 0 exit codes, the infrastructure can trigger deployment hooks (e.g., Vercel Auto-Deploy).

If utilizing a VPS, we recommend setting up GitHub Actions using `appleboy/ssh-action` to automatically run `git pull && npm install && npm run build && pm2 reload pahadigo-production`.
