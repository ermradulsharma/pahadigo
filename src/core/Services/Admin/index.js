import AuditService from './AuditService.js';
import BookingService from './BookingService.js';
import CategoryDocumentService from './CategoryDocumentService.js';
import CategoryService from './CategoryService.js';
import DashboardService from './DashboardService.js';
import LocationService from './LocationService.js';
import MarketingService from './MarketingService.js';
import OCRService from './OCRService.js';
import PackageService from './PackageService.js';
import PolicyService from './PolicyService.js';
import ReviewService from './ReviewService.js';
import SettingsService from './SettingsService.js';
import TravellerService from './TravellerService.js';
import VendorService from './VendorService.js';

export {
    AuditService,
    BookingService,
    CategoryDocumentService,
    CategoryService,
    DashboardService,
    LocationService,
    MarketingService,
    OCRService,
    PackageService,
    PolicyService,
    ReviewService,
    SettingsService,
    TravellerService,
    VendorService
};

export default {
    audit: AuditService,
    booking: BookingService,
    categoryDocument: CategoryDocumentService,
    category: CategoryService,
    dashboard: DashboardService,
    location: LocationService,
    marketing: MarketingService,
    ocr: OCRService,
    package: PackageService,
    policy: PolicyService,
    review: ReviewService,
    settings: SettingsService,
    traveller: TravellerService,
    vendor: VendorService
};
