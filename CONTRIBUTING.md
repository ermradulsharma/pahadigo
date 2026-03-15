# 🤝 Contributing to PahadiGo

First off, deeply thank you for considering contributing to PahadiGo! Our core mission is to bring state-of-the-art tech to Himalayan tourism, and open-source collaboration is completely central to that vision.

This document serves fundamentally as a stringent set of guidelines, not strict rules. Utilize your absolute best judgment, and profoundly feel free to formally propose paradigm shifts to this document in a pull request.

---

## 🏔️ 1. Project Organization

### Tech Stack Orientation
Before contributing to core logic, ensure you are deeply familiar with:
* **Next.js 15.1.x App Router** routing conventions.
* **Mongoose Models** and embedded document arrays.
* **Tailwind CSS v4.0** utility configurations.
* **Service-Oriented Architecture (SOA)** separated completely from Controllers.

### Directory Walkthrough
* `src/app/` - React frontend and Edge API Routes. Do **not** place business logic here.
* `src/core/Services/` - Deep business logic handling (e.g. `BookingService.js`).
* `src/core/Models/` - Database schemas.
* `src/core/Http/Controllers/` - Explicit HTTP orchestrators returning the standardized `ResponseHelper` outputs.

---

## 🛠️ 2. Development Workflow

### Step 1: Fork and Clone
Fork the enterprise repository heavily. Clone your fork locally using HTTPS or SSH. Add the upstream pristine repository to your local Git.

```bash
git clone https://github.com/YOUR_USERNAME/pahadigo.git
cd pahadigo
git remote add upstream https://github.com/pahadigo/pahadigo.git
```

### Step 2: Environment Setup
Verify you are executing strictly Node `v20.x` or higher. Look at `.env.example` deeply, bind it to `.env`, and launch the core stack.

```bash
npm install
npm run dev
```

### Step 3: Strategic Branching
Never execute commits on `main`. Create an explicit, cleanly named branch for your feature or targeted bugfix.

```bash
git checkout -b feature/dynamic-trekking-pricing
# OR
git checkout -b fix/vendor-ocr-timeout
```

### Step 4: Strict Commit Conventions
We enforce [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) rigorously.

* `feat:` A net-new targeted feature.
* `fix:` A bug target deployment.
* `docs:` Documentation strictly (Markdown updates).
* `style:` Cleanups, formatting exclusively (no logic change).
* `refactor:` Code architecture modification strictly without breaking external ABI.
* `test:` Missing deep tests or resolving fragile test suites.
* `chore:` Build processes or auxiliary orchestration updating.

Examples:
* `feat: integrate Razorpay split payments for vendors`
* `fix(admin): resolve audit log pagination overflow`
* `docs: enrich API documentation with Chardham schema`

---

## 🧪 3. Testing Requirements

**No PR will be blindly merged without exhaustive testing.**

### Running Tests
Execute the testing suite against the isolated `mongodb-memory-server` cache.

```bash
# Run unit and integration hooks
npm run test

# Run tests targeting specific API scopes
npm run test tests/api/auth.api.test.js
```

### Writing Tests
1. **Controllers**: Create an `.api.test.js` file leveraging mocked `req/res` objects and Mongoose data seeding. Evaluate `get`, `create`, `update`, and strictly test `404/400/500` error cascades.
2. **Services**: Write specific Unit tests targeting isolated logic (e.g. checking if `generateOTP` calculates correct entropy).

---

## 📦 4. Pull Request Standards

Ensure your PR executes the following before dispatch:

1. **Self-Review**: Have you read your own diff completely?
2. **Test Coverage**: Did you write tests for the unhappy paths?
3. **No Console Logs**: Scrub `console.log()` explicitly (favor throwing errors so `jest` or the Logger intercepts them).
4. **Descriptive Summary**: Fill out the provided PR interactive template meticulously. Include screenshots if you're executing frontend UI permutations.

Your PR will automatically trigger GitHub Actions. Ensure CI states turn pristine green. If it fails due to a Linting anomaly or Jest crash, adjust your local branch heavily and push to automatically update the PR.

---

## 🗺️ 5. Where To Contribute?

Check explicitly our GitHub Issues dynamically labeled `good first issue` or `help wanted`.

* **Frontend**: Transforming `components` into standalone highly-reusable React Server Components with rigorous prop typing.
* **Backend**: Expanding `AuthService` logic to securely handle more OAuth targets. Adding more `jest` integration tests across legacy Controllers.
* **Documentation**: Correcting API permutations, explaining MongoDB mapping concepts, and improving developer UX broadly.
