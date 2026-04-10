import module from '@/routes/Traveller/traveller.js';

describe('Industry Standard: traveller Module', () => {
    it('[Success] should satisfy core import requirements', () => {
        expect(module).toBeDefined();
    });
});
