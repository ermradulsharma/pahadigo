import { jest } from '@jest/globals';

const { bookingPayload, calculateCancellationRefund } = await import('@/core/Helpers/bookingHelper.js');

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
            startDate: new Date('2026-10-30'),
            endDate: new Date('2026-11-05'),
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

    it('should calculate canCancel: true and real-time refund amount when eligible', () => {
        const now = new Date('2026-10-01T00:00:00Z').getTime();
        // 10 days before trip -> 100% refund
        const mockBooking = {
            _id: '64d2f190e4b02c89f50e8201',
            bookingCode: 'PH-2026-MANALI-001',
            status: 'confirmed',
            paymentStatus: 'paid',
            startDate: new Date('2026-10-11T00:00:00Z'),
            pricing: { total: 10000 }
        };

        const result = bookingPayload(mockBooking, { now });
        expect(result.cancellation).toBeDefined();
        expect(result.cancellation.canCancel).toBe(true);
        expect(result.cancellation.refundOnCancel).toBe(10000);
    });

    it('should calculate 50% refund when cancelled between 48h and 7 days before trip', () => {
        const now = new Date('2026-10-01T00:00:00Z').getTime();
        // 4 days before trip -> 50% refund
        const mockBooking = {
            status: 'confirmed',
            paymentStatus: 'paid',
            startDate: new Date('2026-10-05T00:00:00Z'),
            pricing: { total: 10000 }
        };

        const result = bookingPayload(mockBooking, { now });
        expect(result.cancellation.canCancel).toBe(true);
        expect(result.cancellation.refundOnCancel).toBe(5000);
    });

    it('should calculate 0 refund when cancelled < 48 hours before trip', () => {
        const now = new Date('2026-10-01T00:00:00Z').getTime();
        // 24 hours before trip -> 0 refund
        const mockBooking = {
            status: 'confirmed',
            paymentStatus: 'paid',
            startDate: new Date('2026-10-02T00:00:00Z'),
            pricing: { total: 10000 }
        };

        const result = bookingPayload(mockBooking, { now });
        expect(result.cancellation.canCancel).toBe(true);
        expect(result.cancellation.refundOnCancel).toBe(0);
    });

    it('should calculate 0 refund when booking is unpaid', () => {
        const now = new Date('2026-10-01T00:00:00Z').getTime();
        const mockBooking = {
            status: 'pending',
            paymentStatus: 'unpaid',
            startDate: new Date('2026-10-20T00:00:00Z'),
            pricing: { total: 10000 }
        };

        const result = bookingPayload(mockBooking, { now });
        expect(result.cancellation.canCancel).toBe(true);
        expect(result.cancellation.refundOnCancel).toBe(0);
    });

    it('should set canCancel: false and refundOnCancel: 0 when booking is already cancelled', () => {
        const mockBooking = {
            _id: '64d2f190e4b02c89f50e8202',
            bookingCode: 'PH-CANCELLED',
            status: 'cancelled',
            paymentStatus: 'refunded',
            pricing: { total: 10000 },
            cancellation: {
                reason: 'Emergency weather delay',
                date: new Date('2026-10-18'),
                actor: 'user_123'
            }
        };

        const result = bookingPayload(mockBooking);
        expect(result.cancellation).toBeDefined();
        expect(result.cancellation.canCancel).toBe(false);
        expect(result.cancellation.refundOnCancel).toBe(0);
        expect(result.cancellation.reason).toBe('Emergency weather delay');
    });

    it('should return null when input booking is null or undefined', () => {
        expect(bookingPayload(null)).toBeNull();
        expect(bookingPayload(undefined)).toBeNull();
    });
});
