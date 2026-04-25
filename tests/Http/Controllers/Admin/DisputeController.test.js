import { jest } from '@jest/globals';

// Mock Services
const mockBookingService = { 
    getDisputes: jest.fn(), 
    resolveDispute: jest.fn() 
};
const mockMessageService = { 
    getMessages: jest.fn(), 
    sendMessage: jest.fn() 
};

jest.unstable_mockModule('@/core/Services/Admin/BookingService.js', () => ({ default: mockBookingService }));
jest.unstable_mockModule('@/core/Services/Admin/MessageService.js', () => ({ default: mockMessageService }));

const { default: DisputeController } = await import('@/core/Http/Controllers/Admin/DisputeController.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');

describe('Industry Standard: DisputeController API Controller', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            url: 'http://localhost/admin/disputes',
            user: { id: 'admin_123' },
            payload: {}
        };
    });

    it('[Fetch] should return list of disputes with pagination', async () => {
        mockBookingService.getDisputes.mockResolvedValue({ disputes: [], total: 0 });

        const response = await DisputeController.getDisputes(mockReq);

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(mockBookingService.getDisputes).toHaveBeenCalled();
    });

    it('[Resolve] should process dispute resolution via service', async () => {
        mockReq.payload = { decision: 'resolved_refunded', adminNotes: 'Refunded' };
        mockBookingService.resolveDispute.mockResolvedValue({ status: 'resolved_refunded' });

        const response = await DisputeController.resolveDispute(mockReq, { params: { id: 'dsp_1' } });

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(mockBookingService.resolveDispute).toHaveBeenCalledWith(
            'admin_123', 'dsp_1', 'resolved_refunded', 'Refunded', mockReq
        );
    });

    it('[Messaging] should fetch message thread for a dispute', async () => {
        mockMessageService.getMessages.mockResolvedValue([]);
        
        const response = await DisputeController.getMessages(mockReq, { params: { id: 'dsp_1' } });

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(mockMessageService.getMessages).toHaveBeenCalledWith('dsp_1');
    });

    it('[Messaging] should post a new message to the thread', async () => {
        mockReq.payload = { message: 'Hello', target: 'vendor' };
        mockMessageService.sendMessage.mockResolvedValue({ message: 'Hello' });

        const response = await DisputeController.sendMessage(mockReq, { params: { id: 'dsp_1' } });

        expect(response.status).toBe(HTTP_STATUS.CREATED);
        expect(mockMessageService.sendMessage).toHaveBeenCalledWith(
            'dsp_1', 'admin_123', 'User', 'Hello', 'vendor'
        );
    });
});
