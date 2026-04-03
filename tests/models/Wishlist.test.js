import Wishlist from '../../src/core/Models/Wishlist.js';
import mongoose from 'mongoose';

describe('Wishlist Model', () => {
    const userId = new mongoose.Types.ObjectId();
    const itemId = new mongoose.Types.ObjectId();

    beforeEach(async () => {
        await Wishlist.deleteMany({});
        await Wishlist.syncIndexes();
    });

    it('should create a wishlist entry', async () => {
        const item = await Wishlist.create({
            user: userId,
            itemId,
            category: 'accommodation'
        });

        expect(item.user).toEqual(userId);
        expect(item.itemId).toEqual(itemId);
        expect(item.category).toBe('accommodation');
    });

    it('should prevent duplicate user/item combinations', async () => {
        await Wishlist.create({ user: userId, itemId });
        const dupe = new Wishlist({ user: userId, itemId });
        await expect(dupe.save()).rejects.toThrow();
    });
});
