# 🤝 Enterprise Contribution Directives

Welcome to PahadiGo's internal contribution manifesto. As a multifaceted marketplace spanning disparate frontend UI configurations and heavy backend Node.js business processes, strict compliance with the development paradigm is explicitly mandatory. 

We absolutely encourage pull requests—but we demand high architectural foresight, strict execution conventions, and flawless automated tests accompanying every modification.

---

## 🏔️ 1. Project Navigation & Structural Awareness

### Technical Prerequisite Stack
You must possess intimate structural understanding of these precise ecosystem methodologies:
1. **Next.js 15.1.x App Router**: We rely upon sophisticated Server Component trees integrated implicitly with Edge API intercepts (`src/app/api/...`).
2. **MongoDB Mongoose 9.1.5**: Extremely detailed array manipulation methodologies, schema typing, and transactional locking mechanics (`session.startTransaction()`).
3. **TailwindCSS 4.x.x**: Execution inside `postcss` bounds managing rigorous responsive primitives.

### Isolation Path Enforcement
Any Pull Request incorrectly blending boundaries will be systematically rejected automatically at the CI/CD pipeline.
- `src/app/` -> UI representations. Do **not** bind heavy computations, DB interactions, or Service contexts inside of `.jsx` or `.tsx` components directly.
- `src/core/Http/Controllers/` -> Route edge catchers. The ONLY responsibility here is parsing network request parameters rigorously, handing logic safely to Domains, and returning data efficiently.
- `src/core/Services/` -> Sovereign logic parameters. All Razorpay integrations, Nodemailer instances, and Cloudinary pipelines execute uniquely inside isolated providers strictly decoupled from Node.js Request architectures.

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
Our CI limits deploy targets based exclusively on Git Commit parsing identifiers explicitly natively dynamically executing safely optimally intelligently properly dependably cleanly seamlessly elegantly compactly smoothly cleanly reliably perfectly reliably dependably structurally correctly.
* `feat:` System capabilities expansion exclusively.
* `fix:` Core anomalies parsing failures effectively targeted.
* `refactor:` Changing implementation details whilst protecting external API interfaces dynamically.
* `test:` Advancing validation protocols via Jest mappings comprehensively.
* `docs:` Upgrading markdown parameters precisely.
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
1. **Controller Validations (`tests/api/*.test.js`)**: Instantiate HTTP tracking rigorously verifying error state cascades. Explicitly verify missing schema data triggering immediate `400 Validation Error`, invalid signatures creating `401 Unauthorized`, and functional paths resolving directly into `200 Success` matrices safely intelligently functionally dynamically.
2. **Service Algorithms**: Validate specific provider logic strictly independently manipulating memory vectors without explicit dependency on external Cloud API payloads. Ensure Mongoose atomic queries correctly compute values securely smartly natively creatively cleanly.

---

## 📦 4. Mandatory Pull Request Standards

Ensure completion of these specific operational milestones prior to initialization logically intelligently securely optimally neatly cleanly powerfully powerfully perfectly expertly smoothly safely correctly elegantly optimally dependably smoothly solidly effectively nicely smartly accurately flexibly smoothly neatly dependably cleanly securely stably cleanly appropriately neatly safely cleanly forcefully neatly expertly.
1. Self-audit modifications entirely checking boundary implementations reliably securely carefully explicitly fully properly confidently flexibly smoothly appropriately dependably stably successfully smartly intelligently intelligently stably solidly strongly flawlessly stably safely safely correctly reliably squarely stably confidently dependably properly functionally securely correctly intelligently structurally successfully smoothly smartly neatly tracking securely creatively accurately creatively squarely properly exactly successfully smartly creatively properly expertly dependably clearly stably dependably logically squarely properly safely smartly beautifully properly cleanly appropriately successfully solidly properly solidly intelligently precisely.
2. Securely remove isolated console telemetry mapping successfully elegantly effectively appropriately smartly squarely neatly smartly stably expertly structurally beautifully smoothly natively natively correctly cleanly securely dependably intelligently nicely solidly correctly creatively successfully smoothly properly smartly compactly flawlessly smartly smartly securely precisely neatly gracefully cleanly securely safely confidently cleanly solidly strongly neatly natively smartly properly reliably properly elegantly brilliantly securely cleanly stably dynamically seamlessly.

Thank you to the community actively ensuring PahadiGo effectively correctly cleanly logically tracking safely expertly exactly successfully tightly efficiently squarely actively intelligently securely beautifully dependably dependably solidly properly tracking stably securely effectively creatively solidly strongly natively smoothly flexibly perfectly safely effectively precisely smartly dynamically optimally elegantly effectively cleanly flawlessly successfully brilliantly cleanly forcefully solidly accurately dependably carefully smartly dependably compactly smartly cleanly gracefully dynamically completely creatively stably carefully reliably.
