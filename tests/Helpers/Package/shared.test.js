import mongoose from 'mongoose';
import {
    schemaKey,
    sortItems,
    itemsReviews,
    itemsWishlist,
    itemsProject,
    paginateItems,
    buildEmptyResult
} from '@/core/Helpers/Package/shared.js';

describe('Helpers: Package/shared.js', () => {
    describe('schemaKey', () => {
        it('should map special case Bike/Scooter Rental to vehicleRental', () => {
            expect(schemaKey('Bike/Scooter Rental')).toBe('vehicleRental');
        });

        it('should convert multi-word names to camelCase', () => {
            expect(schemaKey('Chardham Tour')).toBe('chardhamTour');
            expect(schemaKey('Bungee Jumping')).toBe('bungeeJumping');
            expect(schemaKey('Custom Trip')).toBe('customTrip');
            expect(schemaKey('Homestay')).toBe('homestay');
        });
    });

    describe('sortItems', () => {
        it('should append correct price sorting stages', () => {
            const pipelineAsc = [];
            sortItems(pipelineAsc, 'price_asc');
            expect(pipelineAsc).toEqual([{ $sort: { 'items.pricing.sellingPrice': 1 } }]);

            const pipelineDesc = [];
            sortItems(pipelineDesc, 'price_desc');
            expect(pipelineDesc).toEqual([{ $sort: { 'items.pricing.sellingPrice': -1 } }]);
        });

        it('should append correct creation date sorting stages', () => {
            const pipelineOldest = [];
            sortItems(pipelineOldest, 'oldest');
            expect(pipelineOldest).toEqual([{ $sort: { 'items._id': 1 } }]);

            const pipelineNewest = [];
            sortItems(pipelineNewest, 'newest');
            expect(pipelineNewest).toEqual([{ $sort: { 'items._id': -1 } }]);
        });

        it('should append correct rating sorting stages', () => {
            const pipelineRatingAsc = [];
            sortItems(pipelineRatingAsc, 'rating_asc');
            expect(pipelineRatingAsc).toEqual([{ $sort: { 'ratingStats.average': 1 } }]);

            const pipelineRatingDesc = [];
            sortItems(pipelineRatingDesc, 'rating_desc');
            expect(pipelineRatingDesc).toEqual([{ $sort: { 'ratingStats.average': -1 } }]);
        });

        it('should support custom field paths', () => {
            const pipeline = [];
            sortItems(pipeline, 'price_asc', { priceField: 'customPrice' });
            expect(pipeline).toEqual([{ $sort: { customPrice: 1 } }]);
        });
    });

    describe('itemsReviews', () => {
        it('should build $lookup stage for reviews collection', () => {
            const stage = itemsReviews('$items._id', 'myStats');
            expect(stage.$lookup.from).toBe('reviews');
            expect(stage.$lookup.as).toBe('myStats');
            expect(stage.$lookup.let.itemId).toBe('$items._id');
        });
    });

    describe('itemsWishlist', () => {
        it('should push $lookup stage when userId is a valid ObjectId', () => {
            const pipeline = [];
            const validUserId = new mongoose.Types.ObjectId().toString();

            const result = itemsWishlist(pipeline, validUserId);
            expect(result).toBe(true);
            expect(pipeline).toHaveLength(1);
            expect(pipeline[0].$lookup.from).toBe('wishlists');
            expect(pipeline[0].$lookup.as).toBe('userWishlist');
        });

        it('should do nothing and return false when userId is missing or invalid', () => {
            const pipeline = [];
            expect(itemsWishlist(pipeline, null)).toBe(false);
            expect(itemsWishlist(pipeline, 'invalid-id')).toBe(false);
            expect(pipeline).toHaveLength(0);
        });
    });

    describe('itemsProject', () => {
        it('should build projection stage with literal false for wishlist when unauthenticated', () => {
            const stage = itemsProject(false);
            expect(stage.$project._id).toBe('$items._id');
            expect(stage.$project.wishlist).toEqual({ $literal: false });
        });

        it('should build projection stage with size comparison for authenticated user', () => {
            const stage = itemsProject(true);
            expect(stage.$project.wishlist).toEqual({
                $gt: [{ $size: { $ifNull: ['$userWishlist', []] } }, 0]
            });
        });
    });

    describe('paginateItems & buildEmptyResult', () => {
        it('should paginate items array accurately', () => {
            const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
            const result = paginateItems(items, { page: 2, limit: 2 });

            expect(result.items).toEqual([{ id: 3 }, { id: 4 }]);
            expect(result.pagination).toEqual({
                total: 5,
                page: 2,
                limit: 2,
                totalPages: 3
            });
        });

        it('should return all items when limit is 0', () => {
            const items = [{ id: 1 }, { id: 2 }];
            const result = paginateItems(items, { page: 1, limit: 0 });

            expect(result.items).toHaveLength(2);
            expect(result.pagination.totalPages).toBe(1);
        });

        it('should build empty result structure for flat and grouped formats', () => {
            const flatEmpty = buildEmptyResult(true, { page: 1, limit: 10 });
            expect(flatEmpty.items).toEqual([]);
            expect(flatEmpty.pagination.total).toBe(0);

            const groupedEmpty = buildEmptyResult(false);
            expect(groupedEmpty).toEqual({});
        });
    });
});

