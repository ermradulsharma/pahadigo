# 🔧 Common Issues & Troubleshooting

**Owner & Lead Architect:** Er. Mradul Sharma
**Platform:** Next.js 16 + Node.js 20 + MongoDB Atlas

This document outlines standard solutions for technical friction frequently encountered during development or in the production environment of PahadiGo.

---

## 🏔️ 1. Database & Connectivity (MongoDB)

### Issue: `MongooseServerSelectionError: connect ECONNREFUSED`
**Symptom**: The API returns a 500 error, and console logs show a failed DB connection.
**Solution**:
1.  **Local Dev**: Ensure your local `mongod` is running.
2.  **Network Access**: If using Atlas, ensure your current IP address (or the server IP) is allow-listed in the MongoDB Atlas dashboard under **Network Access**.

### Issue: `MongoServerError: E11000 duplicate key error`
**Symptom**: A user registration or package creation fails with a "Duplicate Key" message.
**Solution**: Check your `src/core/Models` indexes. This is common if you are re-registering an email or business name that was previously deleted but still exists in the DB (or as a partial index). Reset the DB using `npm run seed` if necessary.

---

## 🔐 2. Authentication & JWT

### Issue: `Unauthorized: JWT Signature Verification Failed`
**Symptom**: You are logged in, but any request returns a 401.
**Solution**: Ensure the `JWT_SECRET` in your `.env` matches the one used by the API. If you changed your environment variables, clear your browser cookies and log in again to generate a new token.

---

## 🏔️ 3. OCR & Image Processing (Cloudinary/Tesseract)

### Issue: `Tesseract.js: Error: Failed to fetch image`
**Symptom**: The OCR pipeline fails when a vendor uploads an Aadhar/PAN image.
**Solution**:
1.  **CORs**: Ensure Cloudinary "Client-Side Uploads" and CORs settings allow requests from your `APP_URL`.
2.  **Buffer Limit**: If the image is extremely large (> 10MB), Node.js may time out. Ensure the image is optimized or compressed via Cloudinary transformations (e.g., `f_jpg,q_auto`).

---

## 🏗️ 4. Build & Environment (Next.js 16)

### Issue: `Module not found: Can't resolve '@/services/X'`
**Symptom**: The Next.js build fails or the dev server crashes with a "Module not found" error for an internal alias.
**Solution**: Check `jsconfig.json`. Ensure the alias exists and that you are using the correct case-sensitive folder path (e.g., `src/core/Services` vs `src/core/services`).

### Issue: `Error: React Server Components cannot be used in Client UI`
**Symptom**: Next.js error during build for an admin page.
**Solution**: Ensure your admin dashboard pages start with `"use client";` at the very top. Only public traveler hubs (`/(website)`) should use default Server Components.

---

## 🧪 5. Testing (Jest)

### Issue: `Jest: Memory Leak / Timeout`
**Symptom**: `npm run test` hangs or crashes with an Out-of-Memory error.
**Solution**:
1.  **Force Exit**: Always run with `--forceExit` (already handled in `package.json`).
2.  **DB Isolation**: Ensure `mongodb-memory-server` is correctly closing its connection in the `afterAll` hook of your test suite.

---

## 📈 6. Still Having Issues?

If a technical blocker remains unresolved after following this guide:

1.  Check the **`CHANGELOG.md`** for recent breaking changes.
2.  Run `npm run lint` and `npm run test` to assert baseline stability.
3.  Escalate to **Er. Mradul Sharma** with a detailed error stack and step-by-step reproduction instructions.
