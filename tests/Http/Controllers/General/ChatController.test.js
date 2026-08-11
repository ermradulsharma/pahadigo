import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/PushNotificationService.js', () => ({
    PushNotificationService: { sendToDevice: jest.fn() }
}));

jest.unstable_mockModule('@/core/Helpers/queryHelpers.js', () => ({
    getBookingById: jest.fn()
}));

const { default: ChatController } = await import('@/core/Http/Controllers/General/ChatController.js');
const { default: Conversation } = await import('@/core/Models/Conversation.js');
const { default: ChatMessage } = await import('@/core/Models/ChatMessage.js');
const { default: Booking } = await import('@/core/Models/Booking.js');
const { default: User } = await import('@/core/Models/User.js');
const { PushNotificationService } = await import('@/core/Services/PushNotificationService.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');
const queryHelpers = await import('@/core/Helpers/queryHelpers.js');

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
        queryHelpers.getBookingById.mockResolvedValue(null);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('[createConversation]', () => {
        test('should return bad request if bookingId or type is missing', async () => {
            mockReq.payload = {};
            const response = await ChatController.createConversation(mockReq);
            const body = await response.json();
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        test('should return bad request if type is invalid', async () => {
            mockReq.payload = { type: 'invalid-type' };
            const response = await ChatController.createConversation(mockReq, { params: { bookingId: 'booking123' } });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        test('should return 404 if booking is not found', async () => {
            mockReq.payload = { type: 'traveller-vendor' };
            queryHelpers.getBookingById.mockResolvedValue(null);
            const response = await ChatController.createConversation(mockReq, { params: { bookingId: 'booking123' } });
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });

        test('should return 404 if booking vendor is missing', async () => {
            mockReq.payload = { type: 'traveller-vendor' };
            queryHelpers.getBookingById.mockResolvedValue({ user: 'user123', vendor: null });
            const response = await ChatController.createConversation(mockReq, { params: { bookingId: 'booking123' } });
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });

        test('should return 403 if traveller does not own booking', async () => {
            mockReq.payload = { type: 'traveller-vendor' };
            mockReq.user.id = 'otherTraveller';
            queryHelpers.getBookingById.mockResolvedValue({ user: 'user123', vendor: { user: 'vendor123' } });
            const response = await ChatController.createConversation(mockReq, { params: { bookingId: 'booking123' } });
            expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
        });

        test('should return 403 if vendor does not own booking', async () => {
            mockReq.payload = { type: 'traveller-vendor' };
            mockReq.user = { id: 'otherVendor', role: 'vendor' };
            queryHelpers.getBookingById.mockResolvedValue({ user: 'user123', vendor: { user: 'vendor123' } });
            const response = await ChatController.createConversation(mockReq, { params: { bookingId: 'booking123' } });
            expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
        });

        test('should create new conversation successfully', async () => {
            mockReq.payload = { type: 'traveller-vendor' };
            queryHelpers.getBookingById.mockResolvedValue({ user: 'user123', vendor: { user: 'vendor123' } });
            jest.spyOn(Conversation, 'findOne').mockResolvedValue(null);
            jest.spyOn(Conversation, 'create').mockResolvedValue({ _id: 'new_convo' });

            const response = await ChatController.createConversation(mockReq, { params: { bookingId: 'booking123' } });
            const body = await response.json();
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data._id).toBe('new_convo');
        });

        test('should fetch existing conversation successfully', async () => {
            mockReq.payload = { type: 'traveller-vendor' };
            queryHelpers.getBookingById.mockResolvedValue({ user: 'user123', vendor: { user: 'vendor123' } });
            jest.spyOn(Conversation, 'findOne').mockResolvedValue({ _id: 'existing_convo' });

            const response = await ChatController.createConversation(mockReq, { params: { bookingId: 'booking123' } });
            const body = await response.json();
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data._id).toBe('existing_convo');
        });

        test('should return 500 on internal error', async () => {
            mockReq.payload = { type: 'traveller-vendor' };
            queryHelpers.getBookingById.mockRejectedValue(new Error('DB failure'));
            const response = await ChatController.createConversation(mockReq, { params: { bookingId: 'booking123' } });
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('[getConversations]', () => {
        test('should return all conversations for admin', async () => {
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

        test('should return filtered conversations for traveller', async () => {
            const mockFind = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([{ _id: 'convo123', toObject: () => ({ _id: 'convo123' }) }])
            };
            jest.spyOn(Conversation, 'find').mockReturnValue(mockFind);

            const response = await ChatController.getConversations(mockReq);
            expect(Conversation.find).toHaveBeenCalledWith({ $or: [{ traveller: 'user123' }, { vendor: 'user123' }] });
            expect(response.status).toBe(HTTP_STATUS.OK);
        });

        test('should return 500 on error', async () => {
            jest.spyOn(Conversation, 'find').mockImplementation(() => { throw new Error('DB fail') });
            const response = await ChatController.getConversations(mockReq);
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('[getMessages]', () => {
        test('should return 400 if conversation ID is missing', async () => {
            const response = await ChatController.getMessages(mockReq, {});
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        test('should return 404 if conversation is not found', async () => {
            jest.spyOn(Conversation, 'findById').mockResolvedValue(null);
            const response = await ChatController.getMessages(mockReq, { params: { id: 'convo123' } });
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });

        test('should return 403 if user not in conversation', async () => {
            jest.spyOn(Conversation, 'findById').mockResolvedValue({ traveller: 'other', vendor: 'other' });
            const response = await ChatController.getMessages(mockReq, { params: { id: 'convo123' } });
            expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
        });

        test('should support pagination and return 200', async () => {
            jest.spyOn(Conversation, 'findById').mockResolvedValue({ traveller: 'user123', vendor: 'vendor123' });
            const mockFind = {
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([{ _id: 'msg1' }])
            };
            jest.spyOn(ChatMessage, 'find').mockReturnValue(mockFind);
            mockReq.url = 'http://localhost/chat/conversations/convo123/messages?limit=10&before=2026-06-20T00:00:00.000Z';
            
            const response = await ChatController.getMessages(mockReq, { params: { id: 'convo123' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
        });

        test('should return 500 on error', async () => {
            jest.spyOn(Conversation, 'findById').mockRejectedValue(new Error('fail'));
            const response = await ChatController.getMessages(mockReq, { params: { id: '1' } });
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('[sendMessage]', () => {
        test('should return 400 if missing message and attachments', async () => {
            mockReq.payload = {};
            const response = await ChatController.sendMessage(mockReq, { params: { id: 'convo123' } });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        test('should return 404 if convo not found', async () => {
            mockReq.payload = { message: 'hi' };
            jest.spyOn(Conversation, 'findById').mockResolvedValue(null);
            const response = await ChatController.sendMessage(mockReq, { params: { id: 'convo123' } });
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });

        test('should return 403 if access denied', async () => {
            mockReq.payload = { message: 'hi' };
            jest.spyOn(Conversation, 'findById').mockResolvedValue({ traveller: 'other', vendor: 'other' });
            const response = await ChatController.sendMessage(mockReq, { params: { id: 'convo123' } });
            expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
        });

        test('should send message, notify offline user, and save successfully', async () => {
            mockReq.payload = { message: 'hi', attachments: [] };
            const mockConvo = {
                _id: 'convo123',
                traveller: 'user123',
                vendor: 'vendor123',
                type: 'traveller-vendor',
                save: jest.fn()
            };
            jest.spyOn(Conversation, 'findById').mockResolvedValue(mockConvo);
            jest.spyOn(ChatMessage, 'create').mockResolvedValue({ _id: 'msg1', message: 'hi' });
            jest.spyOn(User, 'findById').mockReturnValue({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue({ fcmToken: 'token123', name: 'John' })
            });

            const response = await ChatController.sendMessage(mockReq, { params: { id: 'convo123' } });
            expect(response.status).toBe(HTTP_STATUS.CREATED);
            expect(mockConvo.save).toHaveBeenCalled();
            expect(PushNotificationService.sendToDevice).toHaveBeenCalled();
        });

        test('should return 500 on error', async () => {
            mockReq.payload = { message: 'hi' };
            jest.spyOn(Conversation, 'findById').mockRejectedValue(new Error('fail'));
            const response = await ChatController.sendMessage(mockReq, { params: { id: '1' } });
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('[getStream]', () => {
        test('should return a ReadableStream response', async () => {
            const response = await ChatController.getStream(mockReq);
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(response.headers.get('Content-Type')).toBe('text/event-stream');
            expect(response.body).toBeInstanceOf(ReadableStream);
        });
        
        test('should return 500 on stream initialization error', async () => {
            const originalRS = global.ReadableStream;
            global.ReadableStream = class { constructor() { throw new Error('stream fail'); } };
            const response = await ChatController.getStream(mockReq);
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
            global.ReadableStream = originalRS;
        });
    });

    describe('[markAsRead]', () => {
        test('should mark unread messages as read', async () => {
            const mockConvo = { traveller: 'user123', vendor: 'vendor123' };
            jest.spyOn(Conversation, 'findById').mockResolvedValue(mockConvo);
            jest.spyOn(ChatMessage, 'updateMany').mockResolvedValue({ modifiedCount: 1 });
            
            const response = await ChatController.markAsRead(mockReq, { params: { id: 'convo123' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
        });

        test('should return 400 if id missing', async () => {
            const response = await ChatController.markAsRead(mockReq, {});
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        test('should return 404 if convo missing', async () => {
            jest.spyOn(Conversation, 'findById').mockResolvedValue(null);
            const response = await ChatController.markAsRead(mockReq, { params: { id: 'convo123' } });
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });

        test('should return 403 if access denied', async () => {
            jest.spyOn(Conversation, 'findById').mockResolvedValue({ traveller: 'other', vendor: 'other' });
            const response = await ChatController.markAsRead(mockReq, { params: { id: 'convo123' } });
            expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
        });

        test('should return 500 on error', async () => {
            jest.spyOn(Conversation, 'findById').mockRejectedValue(new Error('fail'));
            const response = await ChatController.markAsRead(mockReq, { params: { id: '1' } });
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });
});
