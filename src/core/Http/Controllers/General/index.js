import CategoryController from '@/core/Controllers/General/CategoryController.js';
import InquiryController from '@/core/Controllers/General/InquiryController.js';
import LocationController from '@/core/Controllers/General/LocationController.js';
import PackageController from '@/core/Controllers/General/PackageController.js';
import PaymentController from '@/core/Controllers/General/PaymentController.js';
import PolicyController from '@/core/Controllers/General/PolicyController.js';
import SOSController from '@/core/Controllers/General/SOSController.js';

export {
  CategoryController,
  InquiryController,
  LocationController,
  PackageController,
  PaymentController,
  PolicyController,
  SOSController
};

export default {
  category: CategoryController,
  inquiry: InquiryController,
  location: LocationController,
  package: PackageController,
  payment: PaymentController,
  policy: PolicyController,
  sos: SOSController
};
