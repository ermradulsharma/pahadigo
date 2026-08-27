import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/Admin/BookingService.js', () => ({
    __esModule: true,
    default: {
        getDisputes: jest.fn(),
        resolveDispute: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Services/Admin/MessageService.js', () => ({
    __esModule: true,
    default: {
        getMessages: jest.fn(),
        sendMessage: jest.fn()
    }
}));

const { default: DisputeController } = await import('@/core/Http/Controllers/Admin/DisputeController.js');
const { default: BookingService } = await import('@/core/Services/Admin/BookingService.js');
const { default: MessageService } = await import('@/core/Services/Admin/MessageService.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');
const { createMockReq } = await import('../../../Helpers/testUtils.js');

describe('Admin DisputeController Unit Tests', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getDisputes', () => {
        it('should fetch list of disputes with filter', async () => {
            mockReq = createMockReq({
                user: { id: 'admin1', role: 'admin' },
                url: 'http://localhost/admin/disputes?status=pending'
            });

            BookingService.getDisputes.mockResolvedValue({ disputes: [{ _id: 'd1', reason: 'Service issue' }], total: 1 });

            const response = await DisputeController.getDisputes(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.disputes).toHaveLength(1);
        });
    });

    describe('resolveDispute', () => {
        it('should resolve dispute and trigger refund/rejection', async () => {
            mockReq = createMockReq({ user: { id: 'admin1', role: 'admin' } });
            mockReq.payload = { decision: 'resolved_refunded', adminNotes: 'Full refund granted' };

            BookingService.resolveDispute.mockResolvedValue({ _id: 'd1', status: 'resolved_refunded' });

            const response = await DisputeController.resolveDispute(mockReq, { params: { id: 'd1' } });
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.status).toBe('resolved_refunded');
            expect(BookingService.resolveDispute).toHaveBeenCalledWith('admin1', 'd1', 'resolved_refunded', 'Full refund granted', mockReq);
        });
    });

    describe('sendMessage', () => {
        it('should send admin dispute message', async () => {
            mockReq = createMockReq({ user: { id: 'admin1', role: 'admin' } });
            mockReq.payload = { message: 'We have received your proof', target: 'all' };

            MessageService.sendMessage.mockResolvedValue({ _id: 'm1', message: 'We have received your proof' });

            const response = await DisputeController.sendMessage(mockReq, { params: { id: 'd1' } });
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.CREATED);
            expect(body.data._id).toBe('m1');
        });
    });
});
