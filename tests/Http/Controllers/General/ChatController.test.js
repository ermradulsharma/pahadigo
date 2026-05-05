import { jest } from '@jest/globals';
import ChatController from '@/core/Http/Controllers/General/ChatController.js';
import Conversation from '@/core/Models/Conversation.js';
import ChatMessage from '@/core/Models/ChatMessage.js';
import Booking from '@/core/Models/Booking.js';
import { HTTP_STATUS } from '@/core/Constants/index.js';

describe('ChatController (Root/General)', () => {
    let mockReq;
    let mockUser;

    beforeEach(() => {
        mockUser = {
            id: 'user123',
            role: 'traveller'
        };
        mockReq = {
            payload: {},
            user: mockUser,
            params: {}
        };
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('createConversation should return bad request if bookingId or type is missing', async () => {
        mockReq.payload = {};
        const response = await ChatController.createConversation(mockReq);
        const body = await response.json();
        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(body.message).toContain('required');
    });

    test('createConversation should return bad request if type is invalid', async () => {
        mockReq.payload = { bookingId: 'booking123', type: 'invalid-type' };
        const response = await ChatController.createConversation(mockReq);
        const body = await response.json();
        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(body.message).toContain('Invalid conversation type');
    });

    test('createConversation should return 404 if booking is not found', async () => {
        mockReq.payload = { bookingId: 'booking123', type: 'traveller-vendor' };
        jest.spyOn(Booking, 'findById').mockReturnValue({
            populate: jest.fn().mockResolvedValue(null)
        });

        const response = await ChatController.createConversation(mockReq);
        const body = await response.json();
        expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        expect(body.message).toContain('Booking not found');
    });

    test('getConversations should return all conversations for admin', async () => {
        mockReq.user = { id: 'admin123', role: 'admin' };
        const mockFind = {
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockResolvedValue([{ _id: 'convo123' }])
        };
        jest.spyOn(Conversation, 'find').mockReturnValue(mockFind);

        const response = await ChatController.getConversations(mockReq);
        const body = await response.json();
        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(body.data).toHaveLength(1);
    });

    test('getMessages should return 400 if conversation ID is missing', async () => {
        const response = await ChatController.getMessages(mockReq, {});
        const body = await response.json();
        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    test('getMessages should return 404 if conversation is not found', async () => {
        jest.spyOn(Conversation, 'findById').mockResolvedValue(null);
        const response = await ChatController.getMessages(mockReq, { params: { id: 'convo123' } });
        const body = await response.json();
        expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    test('sendMessage should return bad request if message content is missing', async () => {
        mockReq.payload = {};
        const response = await ChatController.sendMessage(mockReq, { params: { id: 'convo123' } });
        const body = await response.json();
        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });
});
