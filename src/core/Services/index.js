import AdminServices from './Admin/index.js';
import AuthServices from './Auth/index.js';
import GeneralServices from './General/index.js';
import TravellerServices from './Traveller/index.js';
import VendorServices from './Vendor/index.js';

export {
    AdminServices,
    AuthServices,
    GeneralServices,
    TravellerServices,
    VendorServices
};

export default {
    admin: AdminServices,
    auth: AuthServices,
    general: GeneralServices,
    traveller: TravellerServices,
    vendor: VendorServices
};
