import * as BasePackageSchema from '@/core/Models/PackageSchemas/BasePackageSchema.js';

describe('Model/Schema: BasePackageSchema.js', () => {
    it('should export valid schema components', () => {
        expect(BasePackageSchema.BasePackageFields).toBeDefined();
        expect(BasePackageSchema.AccommodationPolicies).toBeDefined();
        expect(BasePackageSchema.BasePackageOptions).toBeDefined();
    });
});
