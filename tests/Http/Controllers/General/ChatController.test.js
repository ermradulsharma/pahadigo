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
            params: {},
            url: 'http://localhost/chat/conversations/convo123/messages'
        };
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(ChatMessage, 'countDocuments').mockResolvedValue(0);
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
        const mockQuery = {
            select: jest.fn().mockReturnThis(),
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(null)
        };
        jest.spyOn(Booking, 'findById').mockReturnValue(mockQuery);

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
        expect(body.data[0].unreadCount).toBe(0);
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

    test('getMessages should support pagination limit and before query parameters', async () => {
        const mockConversation = {
            _id: 'convo123',
            traveller: 'user123',
            vendor: 'vendor123'
        };
        jest.spyOn(Conversation, 'findById').mockResolvedValue(mockConversation);

        const mockFind = {
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([{ _id: 'msg1', createdAt: new Date() }])
        };
        jest.spyOn(ChatMessage, 'find').mockReturnValue(mockFind);

        mockReq.url = 'http://localhost/chat/conversations/convo123/messages?limit=10&before=2026-06-20T00:00:00.000Z';
        const response = await ChatController.getMessages(mockReq, { params: { id: 'convo123' } });
        const body = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(ChatMessage.find).toHaveBeenCalledWith(expect.objectContaining({
            conversation: 'convo123',
            createdAt: expect.any(Object)
        }));
    });

    test('sendMessage should return bad request if message content is missing and no attachments', async () => {
        mockReq.payload = {};
        const response = await ChatController.sendMessage(mockReq, { params: { id: 'convo123' } });
        const body = await response.json();
        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    test('sendMessage should pass validation if only attachments are provided', async () => {
        const mockConversation = {
            _id: 'convo123',
            traveller: 'user123',
            vendor: 'vendor123',
            save: jest.fn().mockResolvedValue(true)
        };
        jest.spyOn(Conversation, 'findById').mockResolvedValue(mockConversation);
        jest.spyOn(ChatMessage, 'create').mockResolvedValue({ _id: 'msg123' });

        mockReq.payload = { attachments: ['http://example.com/file.jpg'] };
        const response = await ChatController.sendMessage(mockReq, { params: { id: 'convo123' } });
        const body = await response.json();
        expect(response.status).toBe(HTTP_STATUS.CREATED);
    });

    test('markAsRead should update isRead status to true', async () => {
        const mockConversation = {
            _id: 'convo123',
            traveller: 'user123',
            vendor: 'vendor123'
        };
        jest.spyOn(Conversation, 'findById').mockResolvedValue(mockConversation);
        jest.spyOn(ChatMessage, 'updateMany').mockResolvedValue({ modifiedCount: 1 });

        const response = await ChatController.markAsRead(mockReq, { params: { id: 'convo123' } });
        const body = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(ChatMessage.updateMany).toHaveBeenCalledWith(
            { conversation: 'convo123', sender: { $ne: 'user123' }, isRead: false },
            { $set: { isRead: true } }
        );
    });
});
