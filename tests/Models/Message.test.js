import mongoose from 'mongoose';
import Message from '@/core/Models/Message.js';

describe('Message Model Schema Verification', () => {
    it('should define the message schema correctly', () => {
        const schema = Message.schema.obj;
        
        expect(schema.disputeId).toBeDefined();
        expect(schema.messages).toBeDefined();
        expect(Array.isArray(schema.messages)).toBe(true);
        
        const messageEntry = schema.messages[0];
        expect(messageEntry.sender).toBeDefined();
        expect(messageEntry.message).toBeDefined();
    });

    it('should create a message entry with default values', async () => {
        const disputeId = new mongoose.Types.ObjectId();
        const senderId = new mongoose.Types.ObjectId();
        
        const messageDoc = new Message({
            disputeId,
            messages: [{
                sender: senderId,
                senderModel: 'User',
                message: "Test message"
            }]
        });

        await messageDoc.validate();
        expect(messageDoc.messages[0].createdAt).toBeDefined();
    });
});
