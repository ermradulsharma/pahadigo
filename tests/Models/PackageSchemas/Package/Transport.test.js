import * as schemas from '@/core/Models/PackageSchemas/Package/Transport';

describe('Model/Schema: Transport.js', () => {
    it('should export valid Mongoose Schemas', () => {
        expect(schemas).toBeDefined();
        Object.keys(schemas).forEach(key => {
            const schema = schemas[key];
            expect(schema).toBeDefined();
            expect(typeof schema).toBe('object');
        });
    });
});
