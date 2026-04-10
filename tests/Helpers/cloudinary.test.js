import module from '@/helpers/cloudinary.js';

describe('Industry Standard: cloudinary Module', () => {
    it('[Success] should satisfy core import requirements', () => {
        expect(module).toBeDefined();
    });
});
