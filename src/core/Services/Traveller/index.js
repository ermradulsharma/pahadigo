import BookingService from './BookingService.js';
import InventoryService from './InventoryService.js';
import PackageService from './PackageService.js';
import ProfileService from './ProfileService.js';
import ReviewService from './ReviewService.js';
import SOSService from './SOSService.js';

export {
    BookingService,
    InventoryService,
    PackageService,
    ProfileService,
    ReviewService,
    SOSService
};

export default {
    booking: BookingService,
    inventory: InventoryService,
    package: PackageService,
    profile: ProfileService,
    review: ReviewService,
    sos: SOSService
};
