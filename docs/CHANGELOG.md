# Changelog

All notable changes to the PahadiGo project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.6.0] - 2026-04-21

### Added
- **Standardization of Response Messages**: Migrated all hardcoded API response strings to a centralized `RESPONSE_MESSAGES` constant object in `src/core/Constants/index.js`.
- **Industry-Standard Professional English**: Performed a comprehensive rewrite of all application messages to follow modern, professional API communication standards.
- **Robustness in SOS Service**: Increased emergency contact limit from 3 to 5 (industry standard) and synchronized logic with standardized constants.

### Changed
- **Unified Error Handling Pattern**: Standardized controllers to use `this.error()` for direct validation failures instead of `throw new Error()`, maintaining architectural separation of concerns.
- **Enhanced Test Environment Stability**: Significantly increased global and individual test timeouts (120s) and optimized MongoDB Memory Server startup (MD5 skip) to prevent infrastructure-related failures.

### Fixed
- **API Message Consistency**: Resolved inconsistencies where mismatched success/error strings were causing test failures and confusing client-side integrations.

## [2.5.0] - 2026-04-20

### Added
- **Vendor Profile Schema Extension**: Added tracking for vendor professional `experience` into the schema and dynamic form parsers for `expertise` array mapping.
- **GeoSpatial Data Handling**: Fully integrated `geoUtils.mapToGeoJSON` into vendor profiles ensuring accurate GeoJSON Point formatting for MongoDB spatial queries.
- **Improved Testing Verification**: Rolled out new Jest validation logic enforcing hard deletes and restricted API return payloads for `ClosureService` ensuring robust vendor business continuity.

### Fixed
- **Dependency Version Conflicts**: Resolved NPM `EOVERRIDE` installation conflicts by streamlining ESLint override definitions inside `package.json` using reference `$eslint`.
- **Vendor Closure Integrity**: Fixed parameter mismatch in `BusinessClosuresController` resulting in inactive user references, and enforced Hard Deletion over Soft Deletes to properly manage business availability.
- **API Payload Security**: Removed the deleted data payload from the API responses on successful DELETE requests for vendor closures.


## [2.4.0] - 2026-04-04

### Changed
- **Unified Status Management**: Migrated from entity-specific status constants to a universal **`STATUS`** constant (`PENDING`, `ACTIVE`, `REJECT`, `BLOCKED`, `SUSPENDED`, `DELETED`).
- **Service Architectural Refactor**: Implemented Class Constructors in **`VendorStatusService`** and **`VendorService`** to centralize status configurations and properties for better maintainability.
- **Improved Authentication Policy**:
    - **`auth.js` Middleware**: Updated to permit `BLOCKED` and `SUSPENDED` users for dashboard/support access, while strictly barring `DELETED` accounts.
    - **`AuthService.js`**: Refactored `_handleDeactivation` to allow restricted logins while preventing account reactivation for non-self-deleted accounts.

### Added
- **Operation-Level Security**: Integrated strict status validation in **`VendorStatusService.isVendorAllowedToOperate`** to block business operations (catalog/booking management) for restricted vendors.
- **Business Profile Authorization Check**: Added **`canManageBusinessProfile`** validation in `VendorController` to restrict profile, document, and bank updates to only `PENDING`, `ACTIVE`, or `REJECT` statuses.

## [2.3.0] - 2026-04-03

### Added
- **Centralized Facade Architecture**: Implemented index-based exports for `@models`, `@services`, `@helpers`, and `@lib`.
- **Architecture Documentation**: Added `docs/ARCHITECTURE.md` updates regarding the modular design.
- **Automated Housekeeping**: Added `npm run clean` command to clear temporary diagnostic logs.

### Fixed
- **100% Test Stability**: Reached a milestone of **265 functional tests passed** across 54 suites.
- **Service Hardening**: Fixed critical null-safety and population logic issues in `InventoryService` and `NotificationService`.
- **Schema Validation**: Restored and validated mandatory fields in `Booking` and `Package` schemas.

## [2.2.0] - 2026-04-02

### Added
- **Security Hardening**: Enforced RBAC for `resetPassword` and `changePassword` endpoints (Admin-only).
- **MFA (Multi-Factor Authentication)**: Mandatory OTP verification implemented for critical authentication flows.
- **Postman API Collection v2**: Reorganized collection into logical subfolders (`Token & Session`, `Account & Profile`).
- **Enhanced Payloads**: Standardized all request bodies to `form-data` with nested field support.

### Fixed
- **Testing Stability**: Implemented `npm test -- --runInBand` to resolve database race conditions.

## [2.1.0] - 2026-03-28

### Added
- **Enterprise Documentation Hub**: Initialized `ARCHITECTURE.md` and `CONTRIBUTING.md`.
- **Next.js 16 Support**: Updated project configuration to align with React 19.

### Fixed
- **Dependency Audit**: Patched 11 vulnerabilities in `@tootallnate/once`.

## [2.0.0] - 2026-03-23

### Added
- **Dynamic Category Filtering**: Automated admin dashboard category population.
- **Admin UI Overhaul**: Modernized dark-mode styles for the administration panel.

## [1.0.0] - 2024-01-01

### Added
- **Initial Core Release**: Established fundamental system architecture, base models, and core API routing for the PahadiGo platform.

---
