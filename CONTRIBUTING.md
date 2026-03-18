# 🤝 Enterprise Contribution Directives

Welcome to PahadiGo's internal contribution manifesto. As a multifaceted marketplace spanning dynamic React UI configurations and heavy backend Node.js business processes, strict compliance with the development paradigm is explicitly mandatory. 

We highly encourage pull requests—but we demand architectural foresight, strict execution conventions, and thorough automated tests accompanying every modification.

---

## 🏔️ 1. Project Navigation & Structural Awareness

### Technical Prerequisite Stack
You must possess intimate structural understanding of these precise ecosystem methodologies:
1. **Next.js 15.1.x App Router**: We rely upon sophisticated Server Component trees integrated implicitly with Edge API intercepts (`src/app/api/...`).
2. **MongoDB Mongoose 9.1.5**: Extremely detailed array manipulation methodologies, schema typing, and transactional locking mechanics (`session.startTransaction()`).
3. **TailwindCSS 4.x.x**: Execution inside `postcss` bounds managing rigorous responsive primitives.

### Isolation Path Enforcement
Any Pull Request incorrectly blending architecture boundaries will be systematically rejected at the CI/CD pipeline.
- `src/app/` -> UI representations. Do **not** bind heavy computations, DB interactions, or Service contexts inside of `.jsx` or `.tsx` components directly.
- `src/core/Http/Controllers/` -> Route edge catchers. The ONLY responsibility here is parsing network request parameters, validating permissions, handing logic safely to Domains, and returning standardized data.
- `src/core/Services/` -> Sovereign logic parameters. All Razorpay integrations, Nodemailer instances, and Cloudinary pipelines execute uniquely inside isolated providers.

---

## 🛠️ 2. Clean Execution Workflows

### Execution Stage 1: Absolute Synchronization
Always fork properly and lock your codebase specifically to Upstream. 
```bash
git remote add upstream https://github.com/pahadigo/pahadigo.git
git fetch upstream
git rebase upstream/main
```

### Execution Stage 2: Development Containerization
Our dependency map expects localized isolation optimizations.
```bash
nvm use # Ensures adherence to Node 20.x+ environments mapping
npm install --legacy-peer-deps # Prevent collision variables locally
npm run seed # Invokes the strict DB instantiation configuration
npm run dev
```

### Execution Stage 3: Feature Branch Contextualizing
```bash
# Targeted logic execution branch parameters
git checkout -b feature/integrate-razorpay-webhooks
git checkout -b fix/auth-controller-malformed-payload
```

### Execution Stage 4: Conventional Commits
Our GitHub Actions pipelines rely exclusively on structured Git Commit descriptors to generate changelogs and trigger correct deployment targets.
* `feat:` System capabilities expansion exclusively.
* `fix:` Core anomalies and parsing failures targeted.
* `refactor:` Changing implement detail whilst protecting external API interfaces.
* `test:` Advancing validation protocols via Jest mappings comprehensively.
* `docs:` Upgrading markdown paramaters precisely.
* `chore:` General operational tooling modifications.

---

## 🧪 3. Deep Jest Testing Parity 

**Code will not be merged if test confidence decreases.** We prioritize aggressive Test-Driven implementations executing explicit functional test bounds across simulated `mongodb-memory-server` isolation layers dynamically parsing against Supertest modules safely.

### Automatic Assertions
```bash
# Validate completely across all mocked API targets internally 
npm run test -- --detectOpenHandles
```

### Constructing Enterprise Quality Specs
1. **Controller Validations (`tests/api/*.test.js`)**: Instantiate HTTP tracking rigorously verifying error state cascades. Explicitly verify missing schema data triggering immediate `400 Validation Error`, invalid signatures creating `401 Unauthorized`, and functional paths resolving directly into `200 Success` matrices safely and securely.
2. **Service Algorithms**: Validate specific provider logic strictly independently manipulating memory vectors without explicit dependency on external Cloud API payloads. Ensure Mongoose atomic queries correctly compute values seamlessly.

---

## 📦 4. Mandatory Pull Request Standards

Ensure completion of these specific operational milestones prior to initializing a pull request:
1. Self-audit modifications entirely checking boundary implementations. Ensure tests pass locally and logic meets established criteria.
2. Securely remove isolated console telemetry such as unnecessary `console.log` or `console.error` to maintain a pristine application execution state.

Thank you to the community actively ensuring PahadiGo remains an optimal and robust platform for its users.
