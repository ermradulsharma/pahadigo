# Changelog

All notable changes to **PahadiGo** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **AI OCR Document Verification**: Integrated intelligent ID scanning for rapid vendor KYC validation (`POST /admin/trigger-ocr`).
- **Comprehensive Next.js App Router Support**: Complete migration of the core frontend and API execution layer to App Router.
- **Dynamic Package Schema**: Built polymorphism into `CategoryDocument` schemas allowing homestays, tracking, and Chardham tours to share a unified database structure but distinct validation logic keys.
- **Extensive Test Coverage**: Created new Jest+MongoDB-Memory-Server integration flows targeting Admin, Settings, and Vendor APIs.

### Changed
- Refactored `SettingsController.js` and `db.js` specifically to leverage connection caching globally instead of establishing redundant instance-level Mongoose connections, completely resolving intermittent latency and 500 errors in test hooks.
- Transformed API responses to strictly utilize `ResponseHelper` standard structure globally: `{ success, message, data }`.
- Rewrote `README.md`, `ARCHITECTURE.md`, `API.md`, and auxiliary files to enterprise standard.

### Fixed
- Resolved a critical Mongoose topology issue where `openUri()` was being redundantly called by legacy Controllers directly instead of utilizing the shared runtime context.
- Rectified undefined Schema fields in the `Settings.js` tests (`supportEmail` vs `smtp_email`).
