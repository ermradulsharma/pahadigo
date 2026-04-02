# 🧪 PahadiGo Quality Control & Testing Architecture

**Test Runner:** Jest (ESM Mode)
**DB Isolation:** `mongodb-memory-server`
**HTTP Mocks:** `Supertest`

This document details how the PahadiGo platform ensures architectural stability and functional correctness through an automated testing pipeline.

---

## 🚦 1. Testing Strategy

PahadiGo employs a "Headless Testing" strategy where the entire application (including the MongoDB persistence layer) is bootstrapped in a virtual environment.

- **Zero-DB Leakage:** Tests never touch the developer's local `pahadigo_dev` or production databases.
- **Atomic State:** Every test file starts with a clean `mongodb-memory-server` instance.
- **Synchronous Execution:** Tests run sequentially (`--runInBand`) to avoid race conditions during DB initialization.

---

## 🏗️ 2. Test Topologies

1.  **Unit Tests (`tests/unit`)**:
    - Focused on logic inside individual helpers and utility functions.
    - Example: Cryptography, OTP duration calculations, and NoSQL sanitization.
2.  **Controller Integration (`tests/api`)**:
    - Uses `Supertest` to simulate HTTP requests against the `apiHandler`.
    - Validates Authentication, RBAC, and Payload Validation (Zod).
    - Example: Verifying that a `Traveller` role cannot reach `/admin/stats`.
3.  **Model Validation (`tests/models`)**:
    - Ensures Mongoose discriminators and compound indexes are correctly applied.
    - Example: Validating that a `Package` correctly stores a `Trekking` service schema.

---

## 🛠️ 3. Environment & Execution

### Execution Protocol
```bash
# Run the complete test suite
npm test
```

### Execution Under the Hood
The `package.json` script triggers:
`node --experimental-vm-modules node_modules/jest/bin/jest.js --detectOpenHandles --runInBand`

### Test Lifecycle (`tests/setup.js`)
1.  **`beforeAll`**: Initializes `MongoMemoryServer` and connects Mongoose to the ephemeral URI.
2.  **`afterEach`**: Clears all collections in the memory database to ensure test isolation.
3.  **`afterAll`**: Gracefully disconnects Mongoose and stops the memory server process.

---

## 🛡️ 4. CI/CD Integration

The repository is configured with **GitHub Actions**. Every pull request or push to the `main` branch triggers:
1.  `npm install`: Resolves the deterministic dependency tree.
2.  `npm test`: Executes the entire suite. Failure blocks the merge.
3.  `npm run lint`: Validates code style against the ESLint 9.x ruleset.

---

## 📝 5. Writing New Tests

Follow the established patterns:
- Place API tests in `tests/api`.
- Always use `request(app)` from Supertest.
- Ensure all required environment variables for the specific test are mocked (e.g., `CLOUDINARY_URL`, `JWT_SECRET`).
- Use `assert` carefully with async/await for clear failure messages.
