import authRoutes from './Auth/auth.js';
import adminRoutes from './Admin/admin.js';
import vendorRoutes from './Vendor/vendor.js';
import travellerRoutes from './Traveller/traveller.js';

import PackageController from '@/controllers/General/PackageController.js';
import CategoryController from '@/controllers/General/CategoryController.js';
import LocationController from '@/controllers/General/LocationController.js';
import PolicyController from '@/controllers/General/PolicyController.js';
import PaymentController from '@/controllers/General/PaymentController.js';
import InquiryController from '@/controllers/General/InquiryController.js';

import Router from './Router.js';
import { wrap } from './helpers.js';

/**
 * Global API Entry (api.js) - Monolithic Entry with Exact Porto-Nesting.
 * All public groups are preserved exactly as defined in the legacy manifest.
 */
const publicRoutes = [
  
  // Browsing Packages (Matches Line 45-50)
  ...Router.group({ prefix: '/packages' }, [
    { method: 'GET', path: '/', handler: wrap(() => PackageController, 'browsePackages') },
    { method: 'GET', path: '/search', handler: wrap(() => PackageController, 'searchNearby') },
    { method: 'GET', path: '/:id', handler: wrap(() => PackageController, 'getPackageDetails') },
  ]),

  // Browsing Categories (Matches Line 52-56)
  ...Router.group({ prefix: '/categories' }, [
    { method: 'GET', path: '/', handler: wrap(() => CategoryController, 'getAll') },
    { method: 'GET', path: '/:id', handler: wrap(() => CategoryController, 'getById') },
  ]),

  // Geography Hub (Matches Line 58-64)
  ...Router.group({ prefix: '/' }, [
    { method: 'GET', path: '/countries', handler: wrap(() => LocationController, 'getCountries') },
    { method: 'GET', path: '/countries/:id', handler: wrap(() => LocationController, 'getCountryById') },
    { method: 'GET', path: '/states', handler: wrap(() => LocationController, 'getStates') },
    { method: 'GET', path: '/countries/:id/states', handler: wrap(() => LocationController, 'getStatesByCountry') },
  ]),

  // Role-Specific Policies (Matches Line 66-70)
  ...Router.group({ prefix: '/vendor' }, [
    { method: 'GET', path: '/privacy-policy', handler: wrap(() => PolicyController, 'getPolicyByType'), params: { target: 'vendor', type: 'privacy_policy' } },
    { method: 'GET', path: '/terms-conditions', handler: wrap(() => PolicyController, 'getPolicyByType'), params: { target: 'vendor', type: 'terms_conditions' } },
  ]),

  // Matches Line 72-78
  ...Router.group({ prefix: '/traveller' }, [
    { method: 'GET', path: '/privacy-policy', handler: wrap(() => PolicyController, 'getPolicyByType'), params: { target: 'traveller', type: 'privacy_policy' } },
    { method: 'GET', path: '/terms-conditions', handler: wrap(() => PolicyController, 'getPolicyByType'), params: { target: 'traveller', type: 'terms_conditions' } },
    { method: 'GET', path: '/refund-policy', handler: wrap(() => PolicyController, 'getPolicyByType'), params: { target: 'traveller', type: 'refund_policy' } },
    { method: 'GET', path: '/cancellation-policy', handler: wrap(() => PolicyController, 'getPolicyByType'), params: { target: 'traveller', type: 'cancellation_policy' } },
  ]),

  // Multi-Target Policies (Matches Line 80-84)
  ...Router.group({ prefix: '/policies' }, [
    { method: 'GET', path: '/:target/:type', handler: wrap(() => PolicyController, 'getPolicyByType') },
    { method: 'GET', path: '/:target', handler: wrap(() => PolicyController, 'getPoliciesByTarget') },
  ]),

  // General Capture Hub
  { method: 'POST', path: '/inquiries', handler: wrap(() => InquiryController, 'submitInquiry') },
  
  // Payment Gateway Capture (Matches Line 103-105)
  ...Router.group({ prefix: '/payment' }, [
    { method: 'POST', path: '/webhook', handler: wrap(() => PaymentController, 'webhook') },
  ]),
];

const routes = [
  ...publicRoutes,
  ...authRoutes,
  ...adminRoutes,
  ...vendorRoutes,
  ...travellerRoutes,
];

export default routes;
