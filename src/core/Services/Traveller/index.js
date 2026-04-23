import BookingService from '@/core/Services/Traveller/BookingService.js';
import InventoryService from '@/core/Services/Traveller/InventoryService.js';
import PackageService from '@/core/Services/Traveller/PackageService.js';
import ProfileService from '@/core/Services/Traveller/ProfileService.js';
import ReviewService from '@/core/Services/Traveller/ReviewService.js';
import SOSService from '@/core/Services/Traveller/SOSService.js';

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
