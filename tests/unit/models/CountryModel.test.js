import mongoose from 'mongoose';
import Country from '../../../src/core/Models/Country.js';

describe('CountryModel Test Suite', () => {
    it('should require name, isoCode, phoneCode, and currency', async () => {
        const country = new Country({});
        let error;
        try { await country.validate(); } catch (e) { error = e; }

        expect(error).toBeDefined();
        expect(error.errors.name).toBeDefined();
        expect(error.errors.isoCode).toBeDefined();
        expect(error.errors.phoneCode).toBeDefined();
        expect(error.errors.currency).toBeDefined();
    });

    it('should uppercase isoCode and default to active status', async () => {
        const country = new Country({
            name: 'India',
            isoCode: ' in ',
            phoneCode: '+91',
            currency: 'INR'
        });

        const saved = await country.save();
        expect(saved.isoCode).toBe('IN');
        expect(saved.status).toBe('active');
    });
});
