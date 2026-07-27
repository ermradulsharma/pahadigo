import mongoose from 'mongoose';
import Booking from '@/models/Booking';
import { cleanDatabase, generateId } from '../Helpers/testUtils.js';
import { BOOKING_STATUS, PAYMENT_STATUS } from '@/constants';

describe('Industry Standard: Booking Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(Booking).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = Booking.schema || Booking;
        expect(schema.paths || schema.obj).toBeDefined();
    });

    it('[Database] should create a valid booking successfully', async () => {
        const bookingData = {
            bookingCode: 'BKG123456',
            user: generateId(),
            vendor: generateId(),
            package: generateId(),
            item: {
                itemId: generateId(),
                itemType: 'accommodation',
                title: 'Himalayan Homestay'
            },
            startDate: new Date(),
            endDate: new Date(Date.now() + 86400000), // +1 day
            pricing: {
                basePrice: 5000,
                subTotal: 5000,
                total: 5250, // including taxes/fees
                tax: 250
            }
        };

        const validBooking = new Booking(bookingData);
        const savedBooking = await validBooking.save();

        expect(savedBooking._id).toBeDefined();
        expect(savedBooking.bookingCode).toBe('BKG123456');
        expect(savedBooking.item.title).toBe('Himalayan Homestay');
        expect(savedBooking.status).toBe(BOOKING_STATUS.PENDING); // Default status
        expect(savedBooking.paymentStatus).toBe(PAYMENT_STATUS.UNPAID); // Default payment status
    });

    it('[Validation] should fail to save without required pricing fields', async () => {
        const invalidBooking = new Booking({
            bookingCode: 'BKG999',
            user: generateId(),
            vendor: generateId(),
            package: generateId(),
            item: { itemId: generateId(), itemType: 'tour', title: 'Trek' },
            startDate: new Date(),
            endDate: new Date()
            // Missing pricing
        });

        let error;
        try {
            await invalidBooking.save();
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.errors['pricing.basePrice']).toBeDefined();
        expect(error.errors['pricing.total']).toBeDefined();
    });

    it('[Defaults] should generate correct default timeline and payment states', async () => {
        const booking = await Booking.create({
            bookingCode: 'BKGDEFAULTS',
            user: generateId(),
            vendor: generateId(),
            package: generateId(),
            item: { itemId: generateId(), itemType: 'rental', title: 'Bike' },
            startDate: new Date(),
            endDate: new Date(),
            pricing: { basePrice: 1000, subTotal: 1000, total: 1000 }
        });

        expect(booking.timeline).toBeDefined();
        expect(booking.payment.gateway).toBe('razorpay');
        expect(booking.occupancy.adults).toBe(1);
        expect(booking.occupancy.children).toBe(0);
    });
});
