# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-03-28

### Added

- **Enterprise Documentation Hub:** Initialized `ARCHITECTURE.md` and `CONTRIBUTING.md` with deep technical context, SOA patterns, and developer setup protocols.
- **Next.js 16 Support:** Fully updated `package.json` and documentation to represent Next.js 16 and React 19 standards.

### Fixed

- **ESLint Peer Dependency Conflict:** Downgraded `eslint` to `^9.21.0` to resolve critical peer dependency mismatches with `eslint-config-next@16.2.1`.
- **Security Vulnerabilities:** Updated `@tootallnate/once` override to `^3.0.1`, resolving 11 vulnerabilities (including High severity) related to `http-proxy-agent` and `firebase-admin` nested trees.
- **README Synchronization:** Updated documentation versions to align with the latest `package.json` specifications.

### Changed

- **Documentation Overhaul:** Refined `README.md` and `SECURITY.md` to reflect enterprise-level standards and modern infrastructure patterns.

## [2.0.0] - 2026-03-23

### Added (v2.0.0)

- **Dynamic Category Filtration:** Admin Packages dashboard now populates its category filter dynamically via the `/api/categories` endpoint, replacing hard-coded values.
- **Improved Routing Architecture:** Reorganized `api.js` to structure the admin endpoints correctly by domain (Dashboard, Users, Inventory, Finances, Moderation, System).
- **Interactive UI Indicators:** The status toggle button within `PackageCard.js` now dynamically adjusts color (Emerald/Rose) and icon based on the package's active state.

### Changed

- **Premium Admin UI Design:** Redesigned the `/admin/packages` Global Packages page with a sleek, modern dark theme leveraging frosted glass headers, tailored grid aesthetics, and advanced CSS shadows.
- **Component Standardization:** Switched out legacy list-views for `PackageCard.js`, establishing reusable UI representations across Vendor Profile Tabs and Admin Package Indexes.
- **RESTful Endpoints:** Updated the `updateServiceStatus` mapped route from `PATCH /api/admin/packages` to `PATCH /api/admin/packages/:id/status` to better adhere to REST conventions.

### Fixed

- **Status Toggle Bug `400 Bad Request`:** Fixed a payload mismatch in `AdminController.updateServiceStatus` where `serviceId` was expected in the body but passed mathematically in the URL. It now correctly derives `serviceId` from endpoint parameters (`params.id`).
- **Callback Param Drop:** Resolved a bug inside `PackageCard.js` where the `onToggleStatus` callback was omitting the `newStatus` payload, thus failing state mutations. It now predictably outputs `(!pkg.isActive)`.
- **Tooltips Contextualized:** Replaced outdated matrix-style button tooltips ("Cut Power / Restore Power") with descriptive actions ("Enable Package / Disable Package").
