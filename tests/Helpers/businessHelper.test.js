import { jest } from '@jest/globals';

const { closurePayload, businessDetailsFormat } = await import('@/core/Helpers/businessHelper.js');

describe('businessHelper Utility Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('closurePayload', () => {
        it('should format a vendor closure document correctly', () => {
            const rawClosure = {
                _id: '64d2f190e4b02c89f50e8301',
                vendor: 'vendor_123',
                startDate: new Date('2026-11-01'),
                endDate: new Date('2026-11-10'),
                reason: 'Off-season maintenance',
                isActive: true
            };

            const result = closurePayload(rawClosure);
            expect(result).toBeDefined();
            expect(result.id).toBe('64d2f190e4b02c89f50e8301');
            expect(result.reason).toBe('Off-season maintenance');
            expect(result.isActive).toBe(true);
        });

        it('should return null when input is empty or has no id', () => {
            expect(closurePayload(null)).toBeNull();
            expect(closurePayload({})).toBeNull();
        });

        it('should handle array of closures', () => {
            const list = [
                { _id: '1', vendor: 'v1', startDate: new Date(), endDate: new Date(), reason: 'R1' },
                { _id: '2', vendor: 'v2', startDate: new Date(), endDate: new Date(), reason: 'R2' }
            ];
            const result = closurePayload(list);
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('1');
            expect(result[1].id).toBe('2');
        });
    });

    describe('businessDetailsFormat', () => {
        it('should format raw vendor document into business details object', () => {
            const mockVendor = {
                _id: '64d2f190e4b02c89f50e8399',
                ownerName: 'Tenzing Norgay',
                businessName: 'Himalayan Cab Expeditions',
                businessNumber: '9876543210',
                businessRegistration: 'HP-CAB-1234',
                gstNumber: '02AAAAA0000A1Z5',
                address: {
                    addressLine1: 'The Mall',
                    city: 'Manali',
                    state: 'Himachal Pradesh'
                },
                profileImage: 'https://res.cloudinary.com/pahadigo/vendor.jpg',
                profileType: 'cabRental',
                status: 'active',
                isOperating: true
            };

            const result = businessDetailsFormat(mockVendor);
            expect(result).toBeDefined();
            expect(result.id).toBe('64d2f190e4b02c89f50e8399');
            expect(result.businessName).toBe('Himalayan Cab Expeditions');
            expect(result.ownerName).toBe('Tenzing Norgay');
            expect(result.status).toBe('active');
        });

        it('should return null when vendor input is null', () => {
            expect(businessDetailsFormat(null)).toBeNull();
        });
    });
});
