import { jest } from '@jest/globals';

jest.unstable_mockModule('mongoose', () => {
    const mockObjectId = Object.assign(
        jest.fn().mockImplementation((id) => id),
        { isValid: jest.fn(() => true) }
    );
    const mockMongoose = {
        startSession: jest.fn(() => ({
            withTransaction: jest.fn(async (cb) => {
                return await cb();
            }),
            endSession: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn()
        })),
        Types: {
            ObjectId: mockObjectId
        },
        Schema: Object.assign(
            jest.fn().mockImplementation(() => ({
                virtual: jest.fn().mockReturnThis(),
                set: jest.fn().mockReturnThis(),
                index: jest.fn().mockReturnThis(),
                pre: jest.fn().mockReturnThis(),
                post: jest.fn().mockReturnThis(),
                methods: {},
                statics: {}
            })),
            { Types: { ObjectId: mockObjectId } }
        ),
        model: jest.fn(),
        models: {}
    };
    return {
        __esModule: true,
        default: mockMongoose,
        Schema: mockMongoose.Schema,
        model: mockMongoose.model,
        models: mockMongoose.models,
        Types: mockMongoose.Types
    };
});

const mockUser = {
    aggregate: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn()
};

const mockVendor = {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn()
};

const mockVendorDocument = {
    findById: jest.fn()
};

const mockPackage = {
    updateMany: jest.fn()
};

const mockVerifiedIdentity = {
    findOneAndUpdate: jest.fn()
};

jest.unstable_mockModule('@/core/Models/User.js', () => ({ default: mockUser }));
jest.unstable_mockModule('@/core/Models/Vendor.js', () => ({ default: mockVendor }));
jest.unstable_mockModule('@/core/Models/VendorDocument.js', () => ({ default: mockVendorDocument }));
jest.unstable_mockModule('@/core/Models/Package.js', () => ({ default: mockPackage }));
jest.unstable_mockModule('@/core/Models/VerifiedIdentity.js', () => ({ default: mockVerifiedIdentity }));

const mockModelsIndex = {
    User: mockUser,
    Vendor: mockVendor,
    VendorDocument: mockVendorDocument,
    Package: mockPackage,
    VerifiedIdentity: mockVerifiedIdentity,
    Booking: {},
    Category: {},
    VendorClosure: {},
    Review: {},
    AuditLog: {},
    Banner: {},
    CategoryDocument: {},
    Country: {},
    Coupon: {},
    Dispute: {},
    EmergencyAlert: {},
    Inquiry: {},
    Inventory: {},
    Policy: {},
    RateLimit: {},
    SearchLog: {},
    Setting: {},
    State: {},
    Wishlist: {},
    Notification: {}
};

jest.unstable_mockModule('@/core/Models/index.js', () => mockModelsIndex);
jest.unstable_mockModule('@/models/index.js', () => mockModelsIndex);

jest.unstable_mockModule('@/core/Services/Admin/OCRService.js', () => ({
    default: {
        processDocument: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Services/General/NotificationService.js', () => ({
    default: {
        notifyVendorApproval: jest.fn(),
        notifyDocumentVerification: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Services/Vendor/BusinessService.js', () => ({
    default: {
        calculateTrustBadge: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Services/CacheService.js', () => ({
    default: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Services/Admin/AuditService.js', () => ({
    default: {
        logAction: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Helpers/AppError.js', () => ({
    default: class AppError extends Error {
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
        }
    }
}));

jest.unstable_mockModule('@/core/Helpers/geoUtils.js', () => ({
    mapToGeoJSON: jest.fn()
}));

jest.unstable_mockModule('@/core/Constants/index.js', () => ({
    RESPONSE_MESSAGES: {
        VENDOR: { NOT_FOUND: 'Vendor not found', ALREADY_EXISTS: 'Already exists', DOCUMENT_NOT_FOUND: 'Doc not found', INVALID_IMAGE: 'Invalid image' },
        AUTH: { ROLE_MISMATCH: 'Role mismatch' },
        ERROR: { INDEX_REQUIRED: 'Index required' }
    },
    USER_ROLES: { SUPER_ADMIN: 'super_admin', ADMIN: 'admin', DEVELOPER: 'developer', VENDOR: 'vendor', TRAVELLER: 'traveller' },
    STATUS: { PENDING: 'pending', ACTIVE: 'active', INACTIVE: 'inactive', REJECT: 'reject', BLOCKED: 'blocked', SUSPENDED: 'suspended', DELETED: 'deleted' },
    VERIFICATION_STATUS: { PENDING: 'pending', VERIFIED: 'verified', REJECTED: 'rejected' },
    HTTP_STATUS: { OK: 200, CREATED: 201, BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, CONFLICT: 409, INTERNAL_SERVER_ERROR: 500 },
    BOOKING_STATUS: { PENDING: 'pending', CONFIRMED: 'confirmed', ONGOING: 'ongoing', CANCELLED: 'cancelled', COMPLETED: 'completed', EXPIRED: 'expired' },
    PAYMENT_STATUS: { PENDING: 'pending', PAID: 'paid', FAILED: 'failed', CANCELLED: 'cancelled', DISPUTE: 'dispute', PARTIALLY_PAID: 'partially_paid', REFUNDED: 'refunded', REFUND_PENDING: 'refund_pending', UNPAID: 'unpaid', PARTIALLY_REFUNDED: 'partially_refunded' },
    PAYOUT_STATUS: { PENDING: 'pending', PAID: 'paid', FAILED: 'failed', REFUNDED: 'refunded', CANCELLED: 'cancelled', DISPUTE: 'dispute', REJECTED: 'rejected', HOLD: 'hold', NOT_PAID: 'not-paid', NOT_REFUNDED: 'not-refunded' },
    REFUND_STATUS: { NONE: 'none', REFUNDED: 'refunded' },
    PAYMENT_METHODS: { UPI: 'upi', CARD: 'card', NET_BANKING: 'net_banking', WALLET: 'wallet', CASH: 'cash' },
    PAYMENT_GATEWAYS: { RAZORPAY: 'razorpay', STRIPE: 'stripe', PAYPAL: 'paypal' },
    BOOKING_SOURCE: { WEB: 'web', ANDROID: 'android', IOS: 'ios', ADMIN: 'admin' },
    AUTH_PROVIDERS: { LOCAL: 'local', GOOGLE: 'google', FACEBOOK: 'facebook', APPLE: 'apple', PHONE: 'phone' },
    GENDER: { MALE: 'male', FEMALE: 'female', OTHER: 'other' },
    DISCOUNT_TYPES: { PERCENTAGE: 'percentage', FLAT: 'flat' },
    CURRENCIES: { EUR: 'EUR', GBP: 'GBP', INR: 'INR', USD: 'USD' },
    NOTIFICATION_TYPES: { BOOKING_CONFIRMED: 'BOOKING_CONFIRMED', BOOKING_CANCELLED: 'BOOKING_CANCELLED', NEW_BOOKING: 'NEW_BOOKING', PAYMENT_SUCCESS: 'PAYMENT_SUCCESS', VENDOR_VERIFIED: 'VENDOR_VERIFIED', VENDOR_REJECTED: 'VENDOR_REJECTED', PACKAGE_APPROVED: 'PACKAGE_APPROVED', PACKAGE_REJECTED: 'PACKAGE_REJECTED', MESSAGE_RECEIVED: 'MESSAGE_RECEIVED' },
    NOTIFICATION_MESSAGES: {},
    LANGUAGES: { BENGALI: 'bn', ENGLISH: 'en', GUJARATI: 'gu', HINDI: 'hi', KANNADA: 'kn', MALAYALAM: 'ml', MARATHI: 'mr', PUNJABI: 'pa', TAMIL: 'ta', TELUGU: 'te' },
    PACKAGE: {},
    VENDOR_PROFILE_TYPES: { BUSINESS: 'business', INDIVIDUAL: 'individual' },
    VENDOR_STATUS: { SET_PROFILE: 'setBusinessProfile', UPLOAD_DOCUMENTS: 'uploadDocuments', COMPLETED: 'profileCompleted' },
    PAGINATION: { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 10, MAX_LIMIT: 100 },
    FILE_UPLOAD: { MAX_SIZE: 5242880, ALLOWED_TYPES: [] },
    UPLOAD_PATHS: {},
    SEED_ACCOUNTS: {},
    THIRD_PARTY_APIS: {},
    SYSTEM_ENV: {},
    APP_DETAILS: { APP_URL: 'http://localhost:3000' },
    APP_SECRETS: {},
    APP_CONSTANTS: {},
    DEFAULTS: {
        USER_ROLE: 'traveller',
        STATUS: 'pending',
        AUTH_PROVIDER: 'phone',
        GENDER: 'other',
        CURRENCY: 'INR',
        COUNTRY: 'India',
        TRUE: true,
        FALSE: false,
        NULL: null,
        ARRAY: [],
        STRING: '',
        UNDEFINED: undefined,
        COUNTS: { ZERO: 0, ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, SIX: 6, SEVEN: 7, EIGHT: 8, NINE: 9 }
    },
    default: {}
}));

const { default: VendorService } = await import('@/core/Services/Admin/VendorService.js');
const { default: User } = await import('@/core/Models/User.js');
const { default: Vendor } = await import('@/core/Models/Vendor.js');
const { default: VendorDocument } = await import('@/core/Models/VendorDocument.js');
const { default: CacheService } = await import('@/core/Services/CacheService.js');
const { default: OCRService } = await import('@/core/Services/Admin/OCRService.js');
const { default: BusinessService } = await import('@/core/Services/Vendor/BusinessService.js');

global.fetch = jest.fn();

describe('Admin VendorService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch.mockResolvedValue({
            ok: true,
            arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(120))
        });
    });

    describe('getAllVendors', () => {
        it('should return from cache if available', async () => {
            CacheService.get.mockResolvedValue([{ name: 'Vendor 1' }]);
            const result = await VendorService.getAllVendors();
            expect(result).toHaveLength(1);
            expect(User.aggregate).not.toHaveBeenCalled();
        });

        it('should fetch from DB, cache and return if not cached', async () => {
            CacheService.get.mockResolvedValue(null);
            User.aggregate.mockResolvedValue([{ name: 'Vendor DB' }]);
            const result = await VendorService.getAllVendors();
            expect(result[0].name).toBe('Vendor DB');
            expect(CacheService.set).toHaveBeenCalledWith('admin:vendors:all', result, 1800);
        });
    });

    describe('getVendorById', () => {
        it('should return null for invalid objectId', async () => {
            // Need to mock mongoose.Types.ObjectId.isValid to return false
            const mongoose = await import('mongoose');
            mongoose.default.Types.ObjectId.isValid.mockReturnValueOnce(false);
            const result = await VendorService.getVendorById('invalid');
            expect(result).toBeNull();
        });

        it('should fetch vendor by id', async () => {
            CacheService.get.mockResolvedValue(null);
            User.aggregate.mockResolvedValue([{ name: 'Vendor DB' }]);
            const result = await VendorService.getVendorById('v1');
            expect(result.name).toBe('Vendor DB');
        });
    });

    describe('createVendor', () => {
        it('should create a new user and vendor if user not found', async () => {
            User.findOne.mockReturnValue({ session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
            User.create.mockResolvedValue([{ _id: 'u1', name: 'Test' }]);
            Vendor.findOne.mockReturnValue({ session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
            Vendor.create.mockResolvedValue([{ _id: 'v1', businessName: 'Biz' }]);

            const data = { email: 'test@test.com', phone: '123' };
            const result = await VendorService.createVendor(data);

            expect(User.create).toHaveBeenCalled();
            expect(Vendor.create).toHaveBeenCalled();
            expect(result.vendor._id).toBe('v1');
        });

        it('should throw if vendor already exists', async () => {
            User.findOne.mockReturnValue({ session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'u1', role: 'vendor' }) }) });
            Vendor.findOne.mockReturnValue({ session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'v1' }) }) });
            
            await expect(VendorService.createVendor({})).rejects.toThrow('Already exists');
        });
    });

    describe('updateVendor', () => {
        it('should throw if neither vendor nor user found', async () => {
            Vendor.findById.mockReturnValue({ session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
            User.findById.mockReturnValue({ session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
            Vendor.findOne.mockReturnValue({ session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
            
            await expect(VendorService.updateVendor('v1', {})).rejects.toThrow('Vendor not found');
        });
    });

    describe('updateVendorStatus', () => {
        it('should update vendor and user status', async () => {
            const mockVendor = { _id: 'v1', user: 'u1', save: jest.fn() };
            Vendor.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(mockVendor) });
            User.findByIdAndUpdate.mockReturnValue({ session: jest.fn().mockResolvedValue({}) });
            User.findById.mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ name: 'User' }) }) });
            
            const result = await VendorService.updateVendorStatus('v1', 'active');
            expect(mockVendor.isApproved).toBe(true);
            expect(mockVendor.status).toBe('active');
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { status: 'active' }, expect.any(Object));
            expect(BusinessService.calculateTrustBadge).toHaveBeenCalledWith('v1');
            expect(result.name).toBe('User');
        });
    });

    describe('deleteVendor', () => {
        it('should mark user as deleted and vendor as not approved', async () => {
            const mockVendor = { _id: 'v1', user: 'u1' };
            Vendor.findById.mockReturnValue({ session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(mockVendor) }) });
            
            await VendorService.deleteVendor('v1', 'admin1');
            
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', expect.objectContaining({ status: 'deleted', deletedBy: 'admin1' }), expect.any(Object));
            expect(Vendor.findByIdAndUpdate).toHaveBeenCalledWith('v1', { isApproved: false }, expect.any(Object));
        });
    });

    describe('verifyCategoryDocument', () => {
        it('should verify document and notify', async () => {
            const mockDoc = { _id: 'd1', vendor: 'v1', save: jest.fn() };
            VendorDocument.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(mockDoc) });
            
            const result = await VendorService.verifyCategoryDocument({ documentId: 'd1', status: 'approved' });
            expect(mockDoc.status).toBe('approved');
            expect(mockDoc.save).toHaveBeenCalled();
            expect(result).toBe(mockDoc);
        });
    });

    describe('verifyDocumentOCR', () => {
        it('should process OCR and update vendor documents', async () => {
            const mockVendor = {
                _id: 'v1',
                user: 'u1',
                documents: { pan: { url: 'http://example.com/pan.jpg', status: 'pending' } },
                markModified: jest.fn(),
                save: jest.fn()
            };
            
            const mockQuery = Promise.resolve(mockVendor);
            mockQuery.session = jest.fn().mockResolvedValue(mockVendor);
            Vendor.findById.mockReturnValue(mockQuery);
            
            OCRService.processDocument.mockResolvedValue({ idType: 'PAN', identifiedId: 'ABCDE1234F', name: 'Test', dob: '01/01/1990', text: 'raw' });
            
            const result = await VendorService.verifyDocumentOCR({ vendorId: 'v1', documentField: 'pan' });
            
            expect(global.fetch).toHaveBeenCalled();
            expect(OCRService.processDocument).toHaveBeenCalled();
            expect(mockVendor.documents.pan.status).toBe('verified');
            expect(mockVendor.save).toHaveBeenCalled();
            expect(result.idNumber).toBe('ABCDE1234F');
        });
    });

    describe('verifyManualDocument', () => {
        it('should update manual document status', async () => {
            const mockVendor = {
                _id: 'v1',
                documents: { adhaar: { status: 'pending' } },
                markModified: jest.fn(),
                save: jest.fn()
            };
            Vendor.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(mockVendor) });
            
            await VendorService.verifyManualDocument({ vendorId: 'v1', documentField: 'adhaar', status: 'approved' });
            
            expect(mockVendor.documents.adhaar.status).toBe('approved');
            expect(mockVendor.markModified).toHaveBeenCalledWith('documents.adhaar');
            expect(mockVendor.save).toHaveBeenCalled();
        });
    });
});
