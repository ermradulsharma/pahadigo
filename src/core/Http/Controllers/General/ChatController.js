import Conversation from '@/core/Models/Conversation.js';
import ChatMessage from '@/core/Models/ChatMessage.js';
import Booking from '@/core/Models/Booking.js';
import { successResponse, errorResponse } from '@/core/Helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { EventEmitter } from 'events';

// In-memory event emitter for live chat updates
const chatEmitter = new EventEmitter();
chatEmitter.setMaxListeners(0);

class ChatController {
  /**
   * POST /chat/conversation
   * Create or fetch existing conversation for a booking.
   */
  async createConversation(req) {
    try {
      const { bookingId, type } = req.payload || {};

      if (!bookingId || !type) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Both bookingId and type are required.');
      }

      if (!['traveller-vendor', 'vendor-admin', 'traveller-admin'].includes(type)) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Invalid conversation type.');
      }

      // Fetch and validate the booking, populating the vendor's user ID
      const booking = await Booking.findById(bookingId).populate('vendor');
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

      return successResponse(HTTP_STATUS.OK, 'Conversations fetched successfully.', conversations);
    } catch (error) {
      console.error('[ChatController] getConversations error:', error);
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  /**
   * GET /chat/conversations/:id/messages
   * Fetch messages for a specific conversation.
   */
  async getMessages(req, { params }) {
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

      // Fetch messages
      const messages = await ChatMessage.find({ conversation: conversationId })
        .sort({ createdAt: 1 });

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
  async sendMessage(req, { params }) {
    try {
      const conversationId = params?.id;
      const { message, attachments } = req.payload || {};

      if (!conversationId) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Conversation ID is required.');
      }
      if (!message) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Message content is required.');
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

      let senderModel = 'User';
      if (req.user.role === 'admin') senderModel = 'Admin';

      // Create new message
      const newMessage = await ChatMessage.create({
        conversation: conversationId,
        sender: req.user.id,
        senderModel,
        message,
        attachments: attachments || []
      });

      // Update the conversation's last message
      conversation.lastMessage = message;
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

      const stream = new ReadableStream({
        start(controller) {
          const onNewMessage = (data) => {
            // Deliver event if conversation involves current user or if the user is admin
            if (
              req.user.role === 'admin' ||
              data.travellerId === userId ||
              data.vendorId === userId
            ) {
              const payload = `data: ${JSON.stringify(data.message)}\n\n`;
              controller.enqueue(new TextEncoder().encode(payload));
            }
          };

          // Register event listener
          chatEmitter.on('newMessage', onNewMessage);

          const heartbeat = setInterval(() => {
            controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
          }, 20000);

          req.signal?.addEventListener('abort', () => {
            chatEmitter.off('newMessage', onNewMessage);
            clearInterval(heartbeat);
          });
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
      console.error('[ChatController] getStream error:', error);
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

export default new ChatController();
