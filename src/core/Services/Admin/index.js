import AuditService from '@/core/Services/Admin/AuditService.js';
import BookingService from '@/core/Services/Admin/BookingService.js';
import CategoryDocumentService from '@/core/Services/Admin/CategoryDocumentService.js';
import CategoryService from '@/core/Services/Admin/CategoryService.js';
import DashboardService from '@/core/Services/Admin/DashboardService.js';
import LocationService from '@/core/Services/Admin/LocationService.js';
import MarketingService from '@/core/Services/Admin/MarketingService.js';
import OCRService from '@/core/Services/Admin/OCRService.js';
import PackageService from '@/core/Services/Admin/PackageService.js';
import PolicyService from '@/core/Services/Admin/PolicyService.js';
import ReviewService from '@/core/Services/Admin/ReviewService.js';
import SettingsService from '@/core/Services/Admin/SettingsService.js';
import TravellerService from '@/core/Services/Admin/TravellerService.js';
import VendorService from '@/core/Services/Admin/VendorService.js';

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
