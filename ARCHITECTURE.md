# 🏛️ Architecture & System Design Specification

**PahadiGo** employs a fully decoupled **Service-Oriented Architecture (SOA)** embedded within the Next.js App Router. This ensures flawless separation between **State Representation & HTTP Routing** and **Business Logic & Entity Transactions**.

This architectural separation permits maximum scalability, robust testing capabilities, and frictionless transitions to explicit microservices if extreme horizontal scaling is required in the future.

---

## 🗄️ Core Architectural Tiers

The system executes logic exclusively across four strictly separated layers:

### 1. 🌐 Ingress & Delivery Layer (`src/app/` & `src/app/api/`)
This is the application's external boundary, managing initial connections and rendering interfaces.
- **Dynamic React UI**: Built with React 19 methodologies and `framer-motion` for complex layer animations. Mixing RSC (React Server Components) for publicly cached landing pages (Static Site Generation / ISR) and highly-interactive Client Components for Vendor/Admin secure dashboards layout using `lucide-react` aesthetics.
- **RESTful API Translators (`src/app/api/*`)**: Highly minimal HTTP interceptor wrappers. They explicitly possess ZERO actual business logic—they catch the `NextRequest` objects, verify HTTP routing paths, and forward sanitized payload executions into the specialized controllers.
- **Edge Middleware Security**: The `middleware.js` interceptor Mathematically maps and decodes JWT signatures against configured RBAC parameter bounds (`traveller`, `vendor`, `admin`) strictly before the application bootstraps.

### 2. 🎮 Controller Mediation Layer (`src/core/Http/Controllers/`)
The translation layer linking incoming HTTP topologies to the internal business execution engine.
- **Schema Validation Engine**: Employs deep payload evaluation using custom generic utilities like `parseNestedFormData` to decode highly complex form data natively prior to algorithmic execution streams.
- **Algorithmic Delegation**: Each HTTP Controller invokes its respective distinct internal service explicitly (e.g., `VendorService.updateBusinessProfile()`).
- **Standardized Serialization Outputs**: All egress traffic is standardized using a globally defined `ResponseHelper`, locking every single API endpoint onto an immutable standard JSON interface (`{ success, message, data }`).

### 3. ⚙️ Domain Service Layer (`src/core/Services/`)
The computational brain of PahadiGo. These singletons process data strictly isolated from web routing semantics (headers, streams, redirects).
- **Domain Providers**: `AuthService`, `BookingService`, `AdminService`, and `PackageService` command the application's state modifications securely.
- **Atomic Concurrency Protection**: High-volume logic (like real-time inventory adjustments in `BookingService`) binds tightly to native MongoDB `$inc` operations inside `mongoose.startSession()` transactional structures, nullifying massive-scale race conditions and double-booking vectors.
- **External API Gateways**: Integrations checking Razorpay payment statuses, establishing Cloudinary uploads, and orchestrating OTP distributions via MSG91/Nodemailer reside strictly isolated inside these services.

### 4. 🗃️ Context & Persistence Layer (`src/core/Models/`)
Mongoose Schema boundaries managing physical persistence mapping exclusively against target MongoDB Document clusters.
- **Strictly Indexed Relationships**: Schema designs optimize lookup times by tightly indexing core analytical keys like `_id`, `vendorId`, `status`, and location-based metadata.
- **Polymorphic Discriminator Schemas**: Complex multidimensional structures like `Package` execute generic variables (`title`, `pricing`) seamlessly extending native sub-schemas (`HomestaySchema`, `TrekkingSchema`).
- **Data Hook Integrations**: Leverages extensive `pre('save')` and `post('findOneAndUpdate')` lifecycle triggers implicitly, resolving cascading deletions without contaminating service/controller layer logic natively.

---

## 🧭 DevOps & Deployment Workflows

### GitHub Actions CI/CD Pipeline
- **Autonomous Gating**: Continuous Integration testing suites automatically leverage `Jest` combined with `mongodb-memory-server` shards to block functional regressions before branches are merged.
- **Dependency Analytics**: Relying upon Dependabot, all critical modules like `.eslintrc.json`, runtime frameworks, and build scripts are automatically updated to eliminate vulnerability exposures globally.

### Connection Resource Pooling (Serverless Constraints)
Since Next.js executes `src/app/api` nodes under serverless configurations in production contexts, executing `mongoose.connect()` on every API hit rapidly causes internal MongoDB Connection Pool exhaustion. 
We explicitly resolve this via `src/core/Config/db.js`, heavily caching the active cluster socket natively onto the global Node execution scope (`global.mongoose`). This dynamically intercepts redundant instantiation commands, ensuring robust connection reuse.

### Modern Mongoose Adjustments (Deprecation Compliance)
Mongoose explicitly flagged structural behaviors like `new: true` options inside `.findOneAndUpdate()` as deeply deprecated legacy variables. The application architecture broadly incorporates the refined `returnDocument: 'after'` natively resolving warning leaks globally and ensuring deterministic entity output during transactions.
