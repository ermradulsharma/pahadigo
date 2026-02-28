import mongoose from 'mongoose';
import Banner from '../../src/core/Models/Banner.js';

describe('BannerModel Test Suite', () => {
    it('should require an imageUrl', async () => {
        const banner = new Banner({ title: 'Welcome' });
        let error;
        try { await banner.validate(); } catch (e) { error = e; }

        expect(error).toBeDefined();
        expect(error.errors.imageUrl).toBeDefined();
    });

    it('should create banner with defaults', async () => {
        const banner = new Banner({ imageUrl: 'http://banner.com/img.jpg' });
        const saved = await banner.save();

        expect(saved.position).toBe(0);
        expect(saved.isActive).toBe(true);
    });
});
