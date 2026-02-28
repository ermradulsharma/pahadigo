import mongoose from 'mongoose';
import State from '../../src/core/Models/State.js';

describe('StateModel Test Suite', () => {
    it('should require name, code, and country reference', async () => {
        const state = new State({});
        let error;
        try { await state.validate(); } catch (e) { error = e; }

        expect(error).toBeDefined();
        expect(error.errors.name).toBeDefined();
        expect(error.errors.code).toBeDefined();
        expect(error.errors.country).toBeDefined();
    });

    it('should uppercase code and prevent duplicates within the same country', async () => {
        const countryId = new mongoose.Types.ObjectId();
        const state1 = new State({
            name: 'Maharashtra',
            code: ' mh ',
            country: countryId
        });
        await state1.save();

        expect(state1.code).toBe('MH');

        const duplicateState = new State({
            name: 'Maharashtra', // Duplicate name
            code: 'MH', // Duplicate code
            country: countryId
        });

        let dupError;
        try { await duplicateState.save(); } catch (e) { dupError = e; }

        expect(dupError).toBeDefined();
        expect(dupError.code).toBe(11000); // Duplicate Key Error
    });
});
