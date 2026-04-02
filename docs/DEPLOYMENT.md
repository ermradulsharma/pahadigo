# 🚀 Deployment Guide — PahadiGo (Private Project)

**Owner & CI/CD Lead:** Er. Mradul Sharma
**Target Environment:** Next.js (Node.js 20+)
**Recommended Host:** Vercel (Edge Functions & ISR) OR DigitalOcean (Droplet/App Platform)

This document provides the technical SOP (Standard Operating Procedure) for deploying the PahadiGo ecosystem.

---

## 🛠️ 1. Infrastructure Preparation

Ensure the following cloud assets are initialized and provisioned:

- **Database**: MongoDB Atlas Cluster (Free/Dedicated). Enable **Network Access** for the target deployment IP.
- **Storage**: Cloudinary Cloud Account. Get `CLOUDINARY_URL` from the dashboard.
- **Messaging**: MSG91 Account with a transactional SMS template.
- **Payments**: Razorpay Dashboard. Generate `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.

---

## 🔒 2. Environment Variables Configuration

The following ENVs must be set at the deployment boundary (e.g., Vercel Settings or `.env.production`):

```env
# Database & Core
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/pahadigo

# Cryptography
JWT_SECRET=highly_secure_generated_key_from_openssl_rand_64
NEXTAUTH_SECRET=same_as_jwt_secret

# Third-Party API Gateways
CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud_name>
MSG91_AUTH_KEY=your_msg91_auth_key
SMTP_HOST=smtp.yourmailserver.com
RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# SEO & Public Metadata
NEXT_PUBLIC_APP_URL=https://pahadigo.com
NEXT_PUBLIC_APP_NAME=PahadiGo
```

---

## ⚙️ 3. Deployment Flow (Manual/Droplet)

If deploying to a self-hosted Linux Droplet using PM2:

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/ermradulsharma/pahadigo.git
    cd travels
    npm install --production
    ```
2.  **Build**:
    ```bash
    npm run build
    ```
3.  **Process Management**:
    ```bash
    pm2 start npm --name "pahadigo-prod" -- start
    pm2 save
    ```
4.  **Static SSL (Nginx)**:
    Point a reverse proxy to `http://localhost:3000` and use `certbot` for SSL termination.

---

## ⚡ 4. Deployment Flow (Vercel - Recommended)

PahadiGo is optimized for the Vercel architecture:

1.  Import the repository into Vercel.
2.  Add **all** Environment Variables.
3.  Vercel will automatically detect the Next.js build command (`next build`).
4.  Deployment will automatically spin up **Serverless Functions** for the API and **Edge Functions** for the middleware.

---

## 🚦 5. Post-Deployment Validation

Immediately following a production push, Er. Mradul Sharma or the dev team must verify:

- [ ] **Health Check**: Hit `/api/stats` to ensure DB connectivity.
- [ ] **Auth Check**: Perform a "forgot password" flow to verify SMTP/Twilio integrity.
- [ ] **Image check**: Upload a mock vendor document to verify Cloudinary buffer streams.
- [ ] **HMR Check**: Ensure Next.js ISR (Incremental Static Regeneration) is correctly caching traveler package pages.

---

## 🧪 6. Automated CI/CD (GitHub Actions)

The project includes a robust `.github/workflows/main.yml`. Every `PUSH` to `main` will:
1.  **LINT**: Assert code quality and ES9 compliance.
2.  **TEST**: Execute the full Jest integration suite against an in-memory DB.
3.  **BUILD**: Dry-run a production build to ensure module resolution.

*Only once all checks pass will the code be eligible for production deployment.*
