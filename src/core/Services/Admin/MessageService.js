import Message from '@/core/Models/Message.js';
import Dispute from '@/core/Models/Dispute.js';

class MessageService {
    async getMessages(disputeId) {
        const thread = await Message.findOne({ disputeId })
            .populate({
                path: 'messages.sender',
                select: 'name email image role'
            }).lean();

        return thread ? thread.messages : [];
    }

    async sendMessage(disputeId, senderId, senderModel, messageText, target = 'all', attachments = []) {
        // Ensure dispute exists
        const dispute = await Dispute.findById(disputeId);
        if (!dispute) throw new Error('Dispute not found');

        const newMessageEntry = {
            sender: senderId,
            senderModel,
            message: messageText,
            target,
            attachments,
            createdAt: new Date()
        };

        // Find or Create the dispute message node
        const updatedThread = await Message.findOneAndUpdate(
            { disputeId },
            {
                $push: { messages: newMessageEntry }
            },
            {
                returnDocument: 'after',
                upsert: true,
                setDefaultsOnInsert: true
            }
        ).populate({
            path: 'messages.sender',
            select: 'name email image role'
        });

        // Return the last added message entry from the array
        const messages = updatedThread.messages;
        return messages[messages.length - 1];
    }
}

export default new MessageService();
