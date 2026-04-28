import AdminServices from '@/core/Services/Admin/index.js';
import AuthServices from '@/core/Services/Auth/index.js';
import GeneralServices from '@/core/Services/General/index.js';
import TravellerServices from '@/core/Services/Traveller/index.js';
import VendorServices from '@/core/Services/Vendor/index.js';
import MasterService from '@/core/Services/MasterService.js';
import { PushNotificationService } from '@/core/Services/PushNotificationService.js';

export {
  AdminServices,
  AuthServices,
  GeneralServices,
  TravellerServices,
  VendorServices,
  MasterService,
  PushNotificationService
};

export default {
  admin: AdminServices,
  auth: AuthServices,
  general: GeneralServices,
  traveller: TravellerServices,
  vendor: VendorServices,
  master: MasterService,
  pushNotification: PushNotificationService
};
