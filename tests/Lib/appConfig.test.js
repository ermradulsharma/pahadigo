import appConfig from '@/lib/appConfig';

describe('Industry Standard: appConfig Core Library', () => {
    it('[Success] should be correctly loaded into the environment', () => {
        expect(appConfig).toBeDefined();
    });
});
