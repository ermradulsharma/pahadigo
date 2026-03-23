# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-23

### Added

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
