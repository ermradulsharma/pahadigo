import * as schemas from '@/core/Models/PackageSchemas/Package/Activity';

describe('Model/Schema: Activity.js', () => {
    it('should export valid Mongoose Schemas', () => {
        expect(schemas).toBeDefined();
        Object.keys(schemas).forEach(key => {
            const schema = schemas[key];
            expect(schema).toBeDefined();
            expect(typeof schema).toBe('object');
        });
    });
});
