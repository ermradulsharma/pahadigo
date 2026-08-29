---
name: db-seeder-runner
description: Standard operational procedure for running PahadiGo MongoDB seeders, resetting test collections, and populating dummy vendor packages, homestays, cab routes, and admin accounts safely.
---

# PahadiGo Database Seeder & Data Management Workflow

## Overview
This skill guides the execution of MongoDB seed scripts (`ResetAndSeed.js` and `MassSeeder.js`) for staging and local development environments without risking production data loss.

## Seeder Commands

1. **Reset & Clean Database**:
   - Clears test collections and populates baseline admin, sample vendors, and default categories.
     ```bash
     node src/core/Database/Seeders/ResetAndSeed.js
     ```

2. **Mass Populate Demo Data**:
   - Generates realistic Himachali and Himalayan packages (Tour Packages, Cab Routes, Kasol Homestays, Trekking Expeditions) with reviews, pricing, and geo-coordinates.
     ```bash
     node src/core/Database/Seeders/MassSeeder.js
     ```

## Safety Constraints
- **NEVER** run seeder scripts when `NODE_ENV=production` or `MONGODB_URI` points to the production cluster.
- Seeders must wrap writes in Mongoose `.lean()` or bulk write operations (`bulkWrite()`) for performance.
