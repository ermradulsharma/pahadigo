# 🗺️ PahadiGo: Deep-Infrastructure Project Map

This document provides an exhaustive recursive mapping of the PahadiGo Enterprise Infrastructure, detailing every file within the Core Kernel, API Boundary, and Stability Suite.

---

## 🌳 1. Complete Visual Repository Treemap

```text
pahadigo/
|-- docs
|   |-- ARCHITECTURE.md
|   |-- CHANGELOG.md
|   |-- CODE_OF_CONDUCT.md
|   |-- CONTRIBUTING.md
|   |-- DEPLOYMENT.md
|   |-- DOCUMENTATION_ANALYSIS.md
|   |-- PROJECT_MAP.md
|   |-- PROJECT_TREEMAP.txt
|   |-- ROADMAP.md
|   +-- SECURITY.md
|-- public
|   |-- fonts
|   |-- icons
|   |-- images
|   +-- next.svg
|-- scripts
|   |-- clearDb.js
|   +-- mongo_dns.json
|-- src
|   |-- app
|   |   |-- (website)
|   |   |   |-- (auth)
|   |   |   |-- layout.js
|   |   |   +-- page.js
|   |   |-- admin
|   |   |   |-- support
|   |   |   |   +-- page.js
|   |   |   +-- page.js
|   |   |-- api
|   |   |   +-- [...slug]
|   |   |       +-- route.js
|   |   |-- favicon.ico
|   |   |-- globals.css
|   |   +-- layout.js
|   |-- components
|   |   |-- admin
|   |   |-- common
|   |   +-- website
|   |-- core
|   |   |-- Config
|   |   |   +-- index.js
|   |   |-- Constants
|   |   |   +-- index.js
|   |   |-- Database
|   |   |   +-- Seeders
|   |   |       |-- CategoryDocumentSeeder.js
|   |   |       |-- CategorySeeder.js
|   |   |       |-- index.js
|   |   |       |-- LocationSeeder.js
|   |   |       |-- PolicySeeder.js
|   |   |       |-- ResetAndSeed.js
|   |   |       |-- SettingSeeder.js
|   |   |       +-- UserSeeder.js
|   |   |-- Helpers
|   |   |   |-- apiHandler.js
|   |   |   |-- auth.js
|   |   |   |-- authUtils.js
|   |   |   |-- availability.js
|   |   |   |-- cloudinary.js
|   |   |   |-- dateUtils.js
|   |   |   |-- env.js
|   |   |   |-- geoUtils.js
|   |   |   |-- index.js
|   |   |   |-- InventoryHelper.js
|   |   |   |-- jwt.js
|   |   |   |-- location.js
|   |   |   |-- parseBody.js
|   |   |   |-- parseNestedFormData.js
|   |   |   |-- queryUtils.js
|   |   |   |-- requestUtils.js
|   |   |   |-- response.js
|   |   |   |-- security.js
|   |   |   |-- TemplateHelper.js
|   |   |   +-- validation.js
|   |   |-- Http
|   |   |   |-- Controllers
|   |   |   |   |-- Admin
|   |   |   |   |   |-- AdminController.js
|   |   |   |   |   |-- BookingController.js
|   |   |   |   |   |-- CategoryController.js
|   |   |   |   |   |-- CategoryDocumentController.js
|   |   |   |   |   |-- DashboardController.js
|   |   |   |   |   |-- DisputeController.js
|   |   |   |   |   |-- InquiryController.js
|   |   |   |   |   |-- LocationController.js
|   |   |   |   |   |-- MarketingController.js
|   |   |   |   |   |-- PackageController.js
|   |   |   |   |   |-- PaymentController.js
|   |   |   |   |   |-- PolicyController.js
|   |   |   |   |   |-- ReviewController.js
|   |   |   |   |   |-- SettingsController.js
|   |   |   |   |   |-- TravellerController.js
|   |   |   |   |   +-- VendorController.js
|   |   |   |   |-- Auth
|   |   |   |   |   +-- AuthController.js
|   |   |   |   |-- General
|   |   |   |   |   |-- CategoryController.js
|   |   |   |   |   |-- InquiryController.js
|   |   |   |   |   |-- LocationController.js
|   |   |   |   |   |-- PackageController.js
|   |   |   |   |   |-- PaymentController.js
|   |   |   |   |   |-- PolicyController.js
|   |   |   |   |   +-- SOSController.js
|   |   |   |   |-- Traveller
|   |   |   |   |   |-- BookingController.js
|   |   |   |   |   |-- PaymentController.js
|   |   |   |   |   |-- ProfileController.js
|   |   |   |   |   |-- ReviewController.js
|   |   |   |   |   |-- SOSController.js
|   |   |   |   |   +-- TravellerController.js
|   |   |   |   |-- Vendor
|   |   |   |   |   |-- BankController.js
|   |   |   |   |   |-- BookingController.js
|   |   |   |   |   |-- BusinessClosuresController.js
|   |   |   |   |   |-- BusinessController.js
|   |   |   |   |   |-- BusinessDocumentController.js
|   |   |   |   |   |-- CategoryController.js
|   |   |   |   |   |-- InventoryController.js
|   |   |   |   |   |-- PackageController.js
|   |   |   |   |   +-- ProfileController.js
|   |   |   |   +-- Controller.js
|   |   |   +-- Middleware
|   |   |       |-- auth.js
|   |   |       |-- rateLimit.js
|   |   |       +-- roleMiddleware.js
|   |   |-- Lib
|   |   |   |-- appConfig.js
|   |   |   +-- index.js
|   |   |-- Models
|   |   |   |-- PackageSchemas
|   |   |   |   |-- BungeeSchema.js
|   |   |   |   |-- CampingSchema.js
|   |   |   |   |-- ChardhamTourSchema.js
|   |   |   |   |-- CustomTripSchema.js
|   |   |   |   |-- HomestaySchema.js
|   |   |   |   |-- HotelSchema.js
|   |   |   |   |-- index.js
|   |   |   |   |-- ParaglidingSchema.js
|   |   |   |   |-- RaftingSchema.js
|   |   |   |   |-- SkiingSchema.js
|   |   |   |   |-- TrekkingSchema.js
|   |   |   |   +-- VehicleRentalSchema.js
|   |   |   |-- AuditLog.js
|   |   |   |-- Banner.js
|   |   |   |-- Booking.js
|   |   |   |-- Category.js
|   |   |   |-- CategoryDocument.js
|   |   |   |-- Country.js
|   |   |   |-- Coupon.js
|   |   |   |-- Dispute.js
|   |   |   |-- EmergencyAlert.js
|   |   |   |-- index.js
|   |   |   |-- Inquiry.js
|   |   |   |-- Inventory.js
|   |   |   |-- Message.js
|   |   |   |-- Package.js
|   |   |   |-- Policy.js
|   |   |   |-- RateLimit.js
|   |   |   |-- Review.js
|   |   |   |-- SearchLog.js
|   |   |   |-- Session.js
|   |   |   |-- Setting.js
|   |   |   |-- State.js
|   |   |   |-- User.js
|   |   |   |-- Vendor.js
|   |   |   |-- VendorClosure.js
|   |   |   |-- VendorDocument.js
|   |   |   |-- VerifiedIdentity.js
|   |   |   +-- Wishlist.js
|   |   |-- Services
|   |   |   |-- Admin
|   |   |   |   |-- AuditService.js
|   |   |   |   |-- BookingService.js
|   |   |   |   |-- CategoryDocumentService.js
|   |   |   |   |-- CategoryService.js
|   |   |   |   |-- DashboardService.js
|   |   |   |   |-- LocationService.js
|   |   |   |   |-- MarketingService.js
|   |   |   |   |-- MessageService.js
|   |   |   |   |-- OCRService.js
|   |   |   |   |-- PackageService.js
|   |   |   |   |-- PolicyService.js
|   |   |   |   |-- ReviewService.js
|   |   |   |   |-- SettingsService.js
|   |   |   |   |-- TravellerService.js
|   |   |   |   +-- VendorService.js
|   |   |   |-- Auth
|   |   |   |   |-- Admin
|   |   |   |   |   +-- AuthService.js
|   |   |   |   |-- User
|   |   |   |   |   |-- AuthService.js
|   |   |   |   |   +-- OTPService.js
|   |   |   |   |-- BaseAuthService.js
|   |   |   |   +-- index.js
|   |   |   |-- General
|   |   |   |   |-- BookingService.js
|   |   |   |   |-- CategoryService.js
|   |   |   |   |-- index.js
|   |   |   |   |-- InventoryService.js
|   |   |   |   |-- LocationService.js
|   |   |   |   |-- NotificationService.js
|   |   |   |   |-- PackageService.js
|   |   |   |   |-- PolicyService.js
|   |   |   |   |-- RazorpayService.js
|   |   |   |   +-- SOSService.js
|   |   |   |-- Traveller
|   |   |   |   |-- BookingService.js
|   |   |   |   |-- index.js
|   |   |   |   |-- InventoryService.js
|   |   |   |   |-- PackageService.js
|   |   |   |   |-- ProfileService.js
|   |   |   |   |-- ReviewService.js
|   |   |   |   +-- SOSService.js
|   |   |   |-- Vendor
|   |   |   |   |-- BankService.js
|   |   |   |   |-- BookingService.js
|   |   |   |   |-- BusinessService.js
|   |   |   |   |-- CategoryService.js
|   |   |   |   |-- ClosureService.js
|   |   |   |   |-- DocumentService.js
|   |   |   |   |-- index.js
|   |   |   |   |-- InventoryService.js
|   |   |   |   +-- PackageService.js
|   |   |   |-- index.js
|   |   |   +-- MasterService.js
|   |   +-- Templates
|   |       +-- Emails
|   |           |-- auth-otp.html
|   |           +-- login-alert.html
|   |-- index.js
|-- tests
|   |-- Config
|   |   +-- db.test.js
|   |-- Constants
|   |   |-- categories.test.js
|   |   +-- index.test.js
|   |-- Database
|   |   +-- Seeders
|   |       |-- CategoryDocumentSeeder.test.js
|   |       |-- CategorySeeder.test.js
|   |       |-- LocationSeeder.test.js
|   |       |-- PolicySeeder.test.js
|   |       |-- ResetAndSeed.test.js
|   |       |-- RunLocationSeeder.test.js
|   |       |-- SettingSeeder.test.js
|   |       +-- UserSeeder.test.js
|   |-- Events
|   |   +-- AuthEvents.test.js
|   |-- Helpers
|   |   |-- apiHandler.test.js
|   |   |-- auth.test.js
|   |   |-- authUtils.test.js
|   |   |-- availability.test.js
|   |   |-- cloudinary.test.js
|   |   |-- dateUtils.test.js
|   |   |-- env.test.js
|   |   |-- geoUtils.test.js
|   |   |-- index.test.js
|   |   |-- InventoryHelper.test.js
|   |   |-- jwt.test.js
|   |   |-- location.test.js
|   |   |-- parseBody.test.js
|   |   |-- parseNestedFormData.test.js
|   |   |-- queryUtils.test.js
|   |   |-- requestUtils.test.js
|   |   |-- response.test.js
|   |   |-- security.test.js
|   |   |-- TemplateHelper.test.js
|   |   |-- testUtils.js
|   |   |-- testUtils.test.js
|   |   +-- validation.test.js
|   |-- Http
|   |   |-- Controllers
|   |   |   |-- Admin
|   |   |   |   |-- BookingController.test.js
|   |   |   |   |-- CategoryController.test.js
|   |   |   |   |-- CategoryDocumentController.test.js
|   |   |   |   |-- DashboardController.test.js
|   |   |   |   |-- DisputeController.test.js
|   |   |   |   |-- InquiryController.test.js
|   |   |   |   |-- LocationController.test.js
|   |   |   |   |-- MarketingController.test.js
|   |   |   |   |-- PackageController.test.js
|   |   |   |   |-- PaymentController.test.js
|   |   |   |   |-- PolicyController.test.js
|   |   |   |   |-- ReviewController.test.js
|   |   |   |   |-- SettingsController.test.js
|   |   |   |   |-- TravellerController.test.js
|   |   |   |   +-- VendorController.test.js
|   |   |   |-- Auth
|   |   |   |   +-- AuthController.test.js
|   |   |   |-- General
|   |   |   |   |-- CategoryController.test.js
|   |   |   |   |-- InquiryController.test.js
|   |   |   |   |-- LocationController.test.js
|   |   |   |   |-- PackageController.test.js
|   |   |   |   |-- PaymentController.test.js
|   |   |   |   |-- PolicyController.test.js
|   |   |   |   +-- SOSController.test.js
|   |   |   |-- Traveller
|   |   |   |   |-- BookingController.test.js
|   |   |   |   |-- PaymentController.test.js
|   |   |   |   |-- ProfileController.test.js
|   |   |   |   |-- ReviewController.test.js
|   |   |   |   |-- SOSController.test.js
|   |   |   |   +-- TravellerController.test.js
|   |   |   |-- Vendor
|   |   |   |   |-- BankController.test.js
|   |   |   |   |-- BookingController.test.js
|   |   |   |   |-- BusinessClosuresController.test.js
|   |   |   |   |-- BusinessController.test.js
|   |   |   |   |-- BusinessDocumentController.test.js
|   |   |   |   |-- CategoryController.test.js
|   |   |   |   |-- InventoryController.test.js
|   |   |   |   |-- PackageController.test.js
|   |   |   |   +-- ProfileController.test.js
|   |   |   +-- Controller.test.js
|   |   +-- Middleware
|   |       |-- auth.test.js
|   |       |-- AuthMiddleware.test.js
|   |       |-- rateLimit.test.js
|   |       +-- roleMiddleware.test.js
|   |-- Integration
|   |   +-- PackageVerification.test.js
|   |-- Lib
|   |   |-- appConfig.test.js
|   |   +-- index.test.js
|   |-- Models
|   |   |-- PackageSchemas
|   |   |   |-- BungeeSchema.test.js
|   |   |   |-- CampingSchema.test.js
|   |   |   |-- ChardhamTourSchema.test.js
|   |   |   |-- CustomTripSchema.test.js
|   |   |   |-- HomestaySchema.test.js
|   |   |   |-- HotelSchema.test.js
|   |   |   |-- ParaglidingSchema.test.js
|   |   |   |-- RaftingSchema.test.js
|   |   |   |-- SkiingSchema.test.js
|   |   |   |-- TrekkingSchema.test.js
|   |   |   +-- VehicleRentalSchema.test.js
|   |   |-- AuditLog.test.js
|   |   |-- Banner.test.js
|   |   |-- Booking.test.js
|   |   |-- Category.test.js
|   |   |-- CategoryDocument.test.js
|   |   |-- Country.test.js
|   |   |-- Coupon.test.js
|   |   |-- Dispute.test.js
|   |   |-- EmergencyAlert.test.js
|   |   |-- index.test.js
|   |   |-- Inquiry.test.js
|   |   |-- Inventory.test.js
|   |   |-- Package.test.js
|   |   |-- Policy.test.js
|   |   |-- RateLimit.test.js
|   |   |-- Review.test.js
|   |   |-- SearchLog.test.js
|   |   |-- Setting.test.js
|   |   |-- State.test.js
|   |   |-- User.test.js
|   |   |-- Vendor.test.js
|   |   |-- VendorClosure.test.js
|   |   |-- VendorDocument.test.js
|   |   |-- VerifiedIdentity.test.js
|   |   +-- Wishlist.test.js
|   |-- Routes
|   |   |-- Admin
|   |   |   +-- admin.test.js
|   |   |-- Auth
|   |   |   +-- auth.test.js
|   |   |-- Public
|   |   |   +-- public.test.js
|   |   |-- Traveller
|   |   |   +-- traveller.test.js
|   |   |-- Vendor
|   |   |   +-- vendor.test.js
|   |   |-- api.test.js
|   |   |-- helpers.test.js
|   |   +-- Router.test.js
|   |-- Services
|   |   |-- Admin
|   |   |   |-- AuditService.test.js
|   |   |   |-- BookingService.test.js
|   |   |   |-- CategoryDocumentService.test.js
|   |   |   |-- CategoryService.test.js
|   |   |   |-- DashboardService.test.js
|   |   |   |-- LocationService.test.js
|   |   |   |-- MarketingService.js
|   |   |   |-- OCRService.test.js
|   |   |   |-- PackageService.test.js
|   |   |   |-- PolicyService.test.js
|   |   |   |-- ReviewService.test.js
|   |   |   |-- SettingsService.test.js
|   |   |   |-- TravellerService.test.js
|   |   |   +-- VendorService.test.js
|   |   |-- Auth
|   |   |   |-- Admin
|   |   |   |   +-- AuthService.test.js
|   |   |   |-- User
|   |   |   |   |-- AuthService.test.js
|   |   |   |   +-- OTPService.test.js
|   |   |   |-- BaseAuthService.test.js
|   |   |   +-- index.test.js
|   |   |-- General
|   |   |   |-- BookingService.test.js
|   |   |   |-- CategoryService.test.js
|   |   |   |-- InventoryService.test.js
|   |   |   |-- LocationService.test.js
|   |   |   |-- NotificationService.test.js
|   |   |   |-- PackageService.test.js
|   |   |   |-- PolicyService.test.js
|   |   |   |-- RazorpayService.test.js
|   |   |   +-- SOSService.test.js
|   |   |-- Traveller
|   |   |   |-- BookingService.test.js
|   |   |   |-- InventoryService.test.js
|   |   |   |-- PackageService.test.js
|   |   |   |-- ProfileService.test.js
|   |   |   |-- ReviewService.test.js
|   |   |   +-- SOSService.test.js
|   |   |-- Vendor
|   |   |   |-- BankService.test.js
|   |   |   |-- BookingService.test.js
|   |   |   |-- BusinessService.test.js
|   |   |   |-- CategoryService.test.js
|   |   |   |-- ClosureService.test.js
|   |   |   |-- DocumentService.test.js
|   |   |   |-- index.test.js
|   |   |   |-- InventoryService.test.js
|   |   |   +-- PackageService.test.js
|   |   +-- MasterService.test.js
|   +-- setup.js
|-- .editorconfig
|-- .env
|-- .env.example
|-- eslint.config.mjs
|-- jest.config.cjs
|-- jsconfig.json
|-- LICENSE.md
|-- next.config.mjs
|-- package-lock.json
|-- package.json
|-- postcss.config.mjs
|-- README.md
+-- tailwind.config.cjs
```

---
**Status:** ✅ visual Treemap Integrated.
