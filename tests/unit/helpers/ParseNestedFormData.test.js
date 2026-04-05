import { parseNestedFormData } from '../../../src/core/Helpers/parseNestedFormData.js';

describe('ParseNestedFormData Test Suite', () => {
    it('should parse simple key-value pairs', () => {
        const formData = new Map([['name', 'John'], ['age', '25']]);
        const result = parseNestedFormData(formData);
        expect(result.name).toBe('John');
        expect(result.age).toBe('25');
    });

    it('should parse boolean values', () => {
        const formData = new Map([['isActive', 'true'], ['isDeleted', 'false']]);
        const result = parseNestedFormData(formData);
        expect(result.isActive).toBe(true);
        expect(result.isDeleted).toBe(false);
    });

    it('should parse nested objects', () => {
        const formData = new Map([
            ['user[name]', 'John'],
            ['user[address][city]', 'New York']
        ]);
        const result = parseNestedFormData(formData);
        expect(result.user.name).toBe('John');
        expect(result.user.address.city).toBe('New York');
    });

    it('should parse arrays', () => {
        const formData = new Map([
            ['tags[0]', 'adventure'],
            ['tags[1]', 'trekking']
        ]);
        const result = parseNestedFormData(formData);
        expect(Array.isArray(result.tags)).toBe(true);
        expect(result.tags[0]).toBe('adventure');
    });
});
