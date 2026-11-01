import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import AppError from '@/core/Helpers/AppError.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';

const mockNotificationService = {
    notifyBookingStatus: jest.fn()
};
const mockInventoryService = {
    checkAvailabilityRange: jest.fn()
};

jest.unstable_mockModule('@/core/Services/Traveller/InventoryService.js', () => ({
    default: mockInventoryService
}));

jest.unstable_mockModule('@/core/Services/General/NotificationService.js', () => ({
    default: mockNotificationService
}));

const { initiateBooking } = await import('@/core/Helpers/Booking/booking.js');

describe('Helpers: Booking/booking.js', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw not found error when itemId is invalid or missing', async () => {
        await expect(initiateBooking({
            userId: 'usr_1',
            body: { startDate: '2026-12-01', endDate: '2026-12-05' },
            itemId: 'invalid-id'
        })).rejects.toThrow(RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);

        await expect(initiateBooking({
            userId: 'usr_1',
            body: { startDate: '2026-12-01', endDate: '2026-12-05' },
            itemId: null
        })).rejects.toThrow(RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);
    });

    it('should throw bad request when startDate or endDate is invalid format', async () => {
        const validItemId = new mongoose.Types.ObjectId().toString();

        await expect(initiateBooking({
            userId: 'usr_1',
            body: { startDate: 'not-a-date', endDate: '2026-12-05' },
            itemId: validItemId
        })).rejects.toThrow('Invalid startDate or endDate format');

        await expect(initiateBooking({
            userId: 'usr_1',
            body: { startDate: '2026-12-01', endDate: 'invalid-date' },
            itemId: validItemId
        })).rejects.toThrow('Invalid startDate or endDate format');
    });
});
