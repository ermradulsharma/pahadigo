import mongoose from 'mongoose';
import { jest } from '@jest/globals';

const { default: MessageService } = await import('@/core/Services/Admin/MessageService.js');
const { default: Message } = await import('@/core/Models/Message.js');
const { default: Dispute } = await import('@/core/Models/Dispute.js');

describe('Industry Standard: MessageService Thread Logic', () => {
    let testDispute;
    let testSenderId;

    beforeEach(async () => {
        testSenderId = new mongoose.Types.ObjectId();
        const dummyId = new mongoose.Types.ObjectId();
        testDispute = await Dispute.create({
            bookingId: dummyId,
            user: dummyId,
            traveller: dummyId,
            vendor: dummyId,
            reason: "vendor_no_show",
            description: "Vendor did not arrive at the location.",
            status: 'open'
        });
    });

    it('[Upsert] should create a new message thread if it does not exist', async () => {
        const messageText = "Hello, this is a test message";
        const result = await MessageService.sendMessage(
            testDispute._id,
            testSenderId,
            'User',
            messageText
        );

        expect(result.message).toBe(messageText);
        expect(result.senderModel).toBe('User');

        const thread = await Message.findOne({ disputeId: testDispute._id });
        expect(thread.messages.length).toBe(1);
    });

    it('[Persistence] should append messages to an existing thread', async () => {
        // First message
        await MessageService.sendMessage(testDispute._id, testSenderId, 'User', "Message 1");
        
        // Second message
        const result = await MessageService.sendMessage(testDispute._id, testSenderId, 'User', "Message 2");

        expect(result.message).toBe("Message 2");

        const thread = await Message.findOne({ disputeId: testDispute._id });
        expect(thread.messages.length).toBe(2);
        expect(thread.messages[0].message).toBe("Message 1");
        expect(thread.messages[1].message).toBe("Message 2");
    });

    it('[Retrieval] should fetch all messages for a dispute', async () => {
        await MessageService.sendMessage(testDispute._id, testSenderId, 'User', "Message A");
        await MessageService.sendMessage(testDispute._id, testSenderId, 'User', "Message B");

        const messages = await MessageService.getMessages(testDispute._id);
        expect(messages.length).toBe(2);
        expect(messages[0].message).toBe("Message A");
    });

    it('[Error Handling] should throw if dispute does not exist', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        await expect(MessageService.sendMessage(fakeId, testSenderId, 'User', "Fail"))
            .rejects.toThrow('Dispute not found');
    });
});
