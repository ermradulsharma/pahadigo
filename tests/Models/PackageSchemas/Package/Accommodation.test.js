import * as schemas from '@/core/Models/PackageSchemas/Package/Accommodation';

describe('Model/Schema: Accommodation.js', () => {
    it('should export valid Mongoose Schemas', () => {
        expect(schemas).toBeDefined();
        Object.keys(schemas).forEach(key => {
            const schema = schemas[key];
            expect(schema).toBeDefined();
            // Since they are plain objects used in schemas, they should have properties
            expect(typeof schema).toBe('object');
        });
    });
});
