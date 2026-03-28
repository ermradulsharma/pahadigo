# 🏗️ Contributing to PahadiGo (Private Project)

Welcome! **PahadiGo** is a private enterprise travel ecosystem owned by **Er. Mradul Sharma**. This guide outlines the standardized operational protocols required for authorized developers to maintain the stability and scalability of the platform. Access to this repository is by invitation only.

---

## 🚦 1. Repository Interaction

### A. Local Setup Protocols

- **Node.js**: Minimum `v20.0.0` (LTS recommended).
- **Environment**: Clone `.env.example` and align required secrets:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `CLOUDINARY_URL`
- **Dependencies**: Use `npm install` (Lockfile integrity is strictly enforced).

### B. Initialization

Execute the seeding sequence before starting development:

```bash
npm run seed     # Initializes Roles, Admin, and Locations
npm run dev      # Boots HMR environment (Next.js 16)
```

---

## 🛠️ 2. Coding Standards & Consistency

We enforce a strict **Service-Oriented Architecture (SOA)**.

- **`src/app`**: Presentation layer ONLY. Should contain routes and UI components.
- **`src/core`**: The "Business Kernel". ALL logic (Auth, Payments, Notifications, Validation) belongs here.
- **Aliases**: Always use absolute path aliases:
  - `@/models/*` for Mongoose models.
  - `@/services/*` for logic services.
  - `@/helpers/*` for core utilities.

### Linting & Formatting

- **ESLint 9.x**: All PRs must pass `npm run lint` without errors.
- **Formatting**: Adhere to the defined `.editorconfig`. Use 4 spaces for indentation.

---

## 🛡️ 3. Security Guidelines

- **Input Validation**: Never trust client-provided data. ALL API endpoints must use **Zod schemas** for exhaustive validation.
- **NoSQL Injection**: Use Mongoose methods exclusively; avoid manual query concatenations.
- **Sensitive Data**: Never log passwords, JWTs, or private keys. The the `logger` service (in `src/core/Helpers`) to filter sensitive info.

---

## 🧪 4. Testing & Quality Control

We aim for high test coverage on the **Core Service Layer**.

### Running Tests

```bash
npm run test           # Executes the full Jest suite
npm run test --watch   # Watch mode for TDD
```

### Writing Tests

- **Database**: Tests use `mongodb-memory-server` to maintain state isolation.
- **Mocks**: Mock external gateways (Razorpay, MSG91) using Jest snapshots or manual mock functions.

---

## 🚀 5. Git Workflow & PRs

1. **Sync**: Always `git pull --rebase` from `main` before starting work.
2. **Branching**: `feature/your-feature-name` or `fix/issue-description`.
3. **Commits**: Use **Conventional Commits** (e.g., `feat: add ocr vendor verification`).
4. **Review**: Every PR requires at least one peer approval and must pass all CI checks (GitHub Actions).

---

## ⚖️ 6. Code of Conduct

Respect, professional collaboration, and high-quality technical output are the cornerstones of the PahadiGo development team.

---

*Thank you for helping us build the future of Himalayan travel orchestration!*
