import { jest } from '@jest/globals';

const { bookingPayload } = await import('@/core/Helpers/bookingHelper.js');

describe('bookingHelper Utility Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should format lean booking document into clean API payload', () => {
        const mockBooking = {
            _id: '64d2f190e4b02c89f50e8201',
            bookingCode: 'PH-2026-MANALI-001',
            status: 'confirmed',
            paymentStatus: 'paid',
            item: { title: 'Manali Riverside Homestay', itemType: 'homestay' },
            startDate: new Date('2026-10-20'),
            endDate: new Date('2026-10-25'),
            occupancy: { adults: 2, children: 0 },
            pricing: { total: 12500, currency: 'INR' },
            payment: {
                orderId: 'order_123',
                paymentId: 'pay_456',
                paidAt: new Date('2026-10-15')
            }
        };

        const result = bookingPayload(mockBooking);
        expect(result).toBeDefined();
        expect(result.bookingId).toBe('64d2f190e4b02c89f50e8201');
        expect(result.bookingCode).toBe('PH-2026-MANALI-001');
        expect(result.status).toBe('confirmed');
        expect(result.paymentStatus).toBe('paid');
        expect(result.item.title).toBe('Manali Riverside Homestay');
        expect(result.pricing.total).toBe(12500);
        expect(result.payment.orderId).toBe('order_123');
        expect(result.payment.paymentId).toBe('pay_456');
    });

    it('should include cancellation object when booking is cancelled', () => {
        const mockBooking = {
            _id: '64d2f190e4b02c89f50e8202',
            bookingCode: 'PH-CANCELLED',
            status: 'cancelled',
            cancellation: {
                reason: 'Emergency weather delay',
                date: new Date('2026-10-18'),
                actor: 'user_123'
            }
        };

        const result = bookingPayload(mockBooking);
        expect(result.cancellation).toBeDefined();
        expect(result.cancellation.reason).toBe('Emergency weather delay');
    });

    it('should return null when input booking is null or undefined', () => {
        expect(bookingPayload(null)).toBeNull();
        expect(bookingPayload(undefined)).toBeNull();
    });
});
