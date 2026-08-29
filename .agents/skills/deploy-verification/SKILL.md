---
name: deploy-verification
description: Pre-flight deployment verification checklist for PahadiGo. Validates Jest unit/integration tests, Zod environment variables, Mongoose schemas, and Next.js production build status before Vercel release.
---

# PahadiGo Pre-Flight Deployment Verification

## Overview
This skill provides a standardized operational procedure for verifying the stability, security, and build health of PahadiGo before committing to production deployment.

## Step-by-step Verification Workflow

1. **Verify Environment Variables**:
   - Validate that all required production keys are set in `envValidator.js` (`MONGODB_URI`, `REDIS_URL`, `QSTASH_TOKEN`, `RAZORPAY_KEY_SECRET`, `JWT_SECRET`).

2. **Execute Full Test Suite**:
   - Run Jest tests in ESM mode:
     ```bash
     npm test
     ```
   - Ensure **0 failing test suites** and **100% pass rate**.

3. **Validate Next.js Production Build**:
   - Run Next.js build compilation check:
     ```bash
     npm run build
     ```
   - Confirm zero TypeScript / ESLint / dynamic route compilation errors.

4. **SEO & AI Standards Check**:
   - Verify that `public/llms.txt`, `public/llms-full.txt`, `src/app/robots.js`, and `src/app/sitemap.js` are present and valid.

5. **Security & Header Check**:
   - Ensure Security Headers (CSP, X-Frame-Options, Referrer-Policy) in `src/app/layout.js` remain intact.
