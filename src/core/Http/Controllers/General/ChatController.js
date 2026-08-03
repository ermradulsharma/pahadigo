import Conversation from '@/core/Models/Conversation.js';
import ChatMessage from '@/core/Models/ChatMessage.js';
import Booking from '@/core/Models/Booking.js';
import { successResponse, errorResponse } from '@/core/Helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { EventEmitter } from 'events';
import { getBookingById } from '@/core/Helpers/queryHelpers.js';
import User from '@/core/Models/User.js';
import { PushNotificationService } from '@/core/Services/PushNotificationService.js';

// In-memory event emitter for live chat updates
const chatEmitter = new EventEmitter();
chatEmitter.setMaxListeners(0);

// Track active users listening to the chat SSE stream
const activeSSEUsers = new Set();

class ChatController {
    /**
     * POST /chat/conversation
     * Create or fetch existing conversation for a booking.
     */
    async createConversation(req, { params } = {}) {
        try {
            const bookingId = params?.bookingId;
            const { type } = req.payload;

            if (!bookingId || !type) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Both bookingId and type are required.');
            }

            if (!['traveller-vendor', 'vendor-admin', 'traveller-admin'].includes(type)) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Invalid conversation type.');
            }

            // Fetch and validate the booking, populating the vendor's user ID
            const booking = await getBookingById(bookingId, '', 'vendor');
            if (!booking) {
                return errorResponse(HTTP_STATUS.NOT_FOUND, 'Booking not found.');
            }

            if (!booking.vendor || !booking.vendor.user) {
                return errorResponse(HTTP_STATUS.NOT_FOUND, 'Vendor user associated with booking not found.');
            }

            const vendorUserId = booking.vendor.user.toString();
            const travellerUserId = booking.user.toString();

            // Verify the user has access to this booking
            if (req.user.role === 'vendor' && req.user.id !== vendorUserId) {
                return errorResponse(HTTP_STATUS.FORBIDDEN, 'You do not have access to this booking.');
            } else if (req.user.role === 'traveller' && req.user.id !== travellerUserId) {
                return errorResponse(HTTP_STATUS.FORBIDDEN, 'You do not have access to this booking.');
            } else if (req.user.role !== 'admin' && req.user.role !== 'vendor' && req.user.role !== 'traveller') {
                return errorResponse(HTTP_STATUS.FORBIDDEN, 'Access denied.');
            }

            // Check if conversation already exists
            let conversation = await Conversation.findOne({ bookingId, type });

            if (!conversation) {
                conversation = await Conversation.create({
                    bookingId,
                    type,
                    traveller: travellerUserId,
                    vendor: vendorUserId,
                    admin: req.user.role === 'admin' ? req.user.id : null,
                    lastMessage: '',
                    lastMessageAt: new Date()
                });
            }

            return successResponse(HTTP_STATUS.OK, 'Conversation retrieved successfully.', conversation);
        } catch (error) {
            console.error('[ChatController] createConversation error:', error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    /**
     * GET /chat/conversations
     * Fetch all conversations for the current authenticated user.
     */
    async getConversations(req) {
        try {
            let query = {};

            if (req.user.role !== 'admin') {
                // Find any conversations where the current user is either the traveller or vendor
                query = { $or: [{ traveller: req.user.id }, { vendor: req.user.id }] };
            }

            const conversations = await Conversation.find(query)
                .populate('traveller vendor', 'firstName lastName email profileImage')
                .populate({ path: 'bookingId', select: 'bookingCode' })
                .sort({ lastMessageAt: -1 });

            // Calculate unread message count for each conversation relative to current user
            const conversationsWithUnread = await Promise.all(
                conversations.map(async (conv) => {
                    const unreadCount = await ChatMessage.countDocuments({
                        conversation: conv._id,
                        sender: { $ne: req.user.id },
                        isRead: false
                    });
                    const convObj = typeof conv.toObject === 'function' ? conv.toObject() : { ...conv };
                    convObj.unreadCount = unreadCount;
                    return convObj;
                })
            );

            return successResponse(HTTP_STATUS.OK, 'Conversations fetched successfully.', conversationsWithUnread);
        } catch (error) {
            console.error('[ChatController] getConversations error:', error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    /**
     * GET /chat/conversations/:id/messages
     * Fetch messages for a specific conversation.
     */
    async getMessages(req, { params } = {}) {
        try {
            const conversationId = params?.id;
            if (!conversationId) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Conversation ID is required.');
            }

            // Verify the user has access to this conversation
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return errorResponse(HTTP_STATUS.NOT_FOUND, 'Conversation not found.');
            }

            if (
                req.user.role !== 'admin' &&
                conversation.traveller.toString() !== req.user.id &&
                conversation.vendor.toString() !== req.user.id
            ) {
                return errorResponse(HTTP_STATUS.FORBIDDEN, 'Access denied to this conversation.');
            }

            // Parse pagination query parameters
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
            const url = new URL(req.url, baseUrl);
            const limit = parseInt(url.searchParams.get('limit') || '50', 10);
            const before = url.searchParams.get('before');

            const query = { conversation: conversationId };
            if (before) {
                query.createdAt = { $lt: new Date(before) };
            }

            // Fetch messages with pagination
            const messages = await ChatMessage.find(query)
                .sort({ createdAt: -1 })
                .limit(limit);

            // Restore chronological order
            messages.reverse();

            return successResponse(HTTP_STATUS.OK, 'Messages fetched successfully.', { conversation, messages });
        } catch (error) {
            console.error('[ChatController] getMessages error:', error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    /**
     * POST /chat/conversations/:id/messages
     * Send a new message.
     */
    async sendMessage(req, { params } = {}) {
        try {
            const conversationId = params?.id;
            const { message, attachments } = req.payload || {};

            if (!conversationId) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Conversation ID is required.');
            }
            const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
            if (!message && !hasAttachments) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Message content or attachments are required.');
            }

            // Verify conversation
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return errorResponse(HTTP_STATUS.NOT_FOUND, 'Conversation not found.');
            }

            if (
                req.user.role !== 'admin' &&
                conversation.traveller.toString() !== req.user.id &&
                conversation.vendor.toString() !== req.user.id
            ) {
                return errorResponse(HTTP_STATUS.FORBIDDEN, 'Access denied to this conversation.');
            }

            const senderModel = req.user.role;

            // Create new message
            const newMessage = await ChatMessage.create({
                conversation: conversationId,
                sender: req.user.id,
                senderModel,
                message: message || '',
                attachments: attachments || []
            });

            // Update the conversation's last message
            conversation.lastMessage = message || (hasAttachments ? '[Attachment]' : '');
            conversation.lastMessageAt = new Date();
            if (req.user.role === 'admin') {
                conversation.admin = req.user.id;
            }
            await conversation.save();

            // Emit real-time live message to active SSE listeners
            chatEmitter.emit('newMessage', {
                conversationId: conversation._id.toString(),
                travellerId: conversation.traveller.toString(),
                vendorId: conversation.vendor.toString(),
                type: conversation.type,
                message: newMessage
            });

            // Send push notification if the receiver is offline
            try {
                let receiverId;
                if (req.user.role === 'traveller') {
                    receiverId = conversation.vendor.toString();
                } else if (req.user.role === 'vendor') {
                    receiverId = conversation.traveller.toString();
                }

                if (receiverId && !activeSSEUsers.has(receiverId)) {
                    const receiverUser = await User.findById(receiverId).select('fcmToken').lean();
                    if (receiverUser && receiverUser.fcmToken) {
                        const senderUser = await User.findById(req.user.id).select('name').lean();
                        const senderName = senderUser ? senderUser.name : 'Someone';

                        await PushNotificationService.sendToDevice(
                            receiverUser.fcmToken,
                            {
                                title: `New message from ${senderName}`,
                                body: message || 'Sent an attachment'
                            },
                            {
                                type: 'chat_message',
                                conversationId: conversation._id.toString()
                            }
                        );
                    }
                }
            } catch (notifError) {
                console.error('[ChatController] Error sending offline push notification:', notifError);
            }

            return successResponse(HTTP_STATUS.CREATED, 'Message sent successfully.', newMessage);
        } catch (error) {
            console.error('[ChatController] sendMessage error:', error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    /**
     * GET /chat/stream
     * Establishes a persistent SSE stream for the authenticated user to receive messages.
     */
    async getStream(req) {
        try {
            const userId = req.user.id;
            let onNewMessage;
            let heartbeat;
            const stream = new ReadableStream({
                start(controller) {
                    activeSSEUsers.add(userId);
                    onNewMessage = (data) => {
                        if (req.user.role === 'admin' || data.travellerId === userId || data.vendorId === userId) {
                            const payload = `data: ${JSON.stringify(data.message)}\n\n`;
                            controller.enqueue(new TextEncoder().encode(payload));
                        }
                    };
                    chatEmitter.on('newMessage', onNewMessage);
                    heartbeat = setInterval(() => {
                        controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
                    }, 20000);
                    req.signal?.addEventListener('abort', () => {
                        activeSSEUsers.delete(userId);
                        if (onNewMessage) chatEmitter.off('newMessage', onNewMessage);
                        if (heartbeat) clearInterval(heartbeat);
                    });
                },
                cancel() {
                    activeSSEUsers.delete(userId);
                    chatEmitter.off('newMessage', onNewMessage);
                    clearInterval(heartbeat);
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no'
                }
            });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    /**
     * PATCH /chat/conversations/:id/read
     * Mark all unread messages in a conversation as read for the receiver.
     */
    async markAsRead(req, { params } = {}) {
        try {
            const conversationId = params?.id;
            if (!conversationId) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Conversation ID is required.');
            }

            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return errorResponse(HTTP_STATUS.NOT_FOUND, 'Conversation not found.');
            }

            if (
                req.user.role !== 'admin' &&
                conversation.traveller.toString() !== req.user.id &&
                conversation.vendor.toString() !== req.user.id
            ) {
                return errorResponse(HTTP_STATUS.FORBIDDEN, 'Access denied to this conversation.');
            }

            await ChatMessage.updateMany(
                { conversation: conversationId, sender: { $ne: req.user.id }, isRead: false },
                { $set: { isRead: true } }
            );

            return successResponse(HTTP_STATUS.OK, 'Conversation marked as read.');
        } catch (error) {
            console.error('[ChatController] markAsRead error:', error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

export default new ChatController();

