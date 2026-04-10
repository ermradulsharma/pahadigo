import CategoryController from './CategoryController.js';
import InquiryController from './InquiryController.js';
import LocationController from './LocationController.js';
import PackageController from './PackageController.js';
import PaymentController from './PaymentController.js';
import PolicyController from './PolicyController.js';
import SOSController from './SOSController.js';

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
