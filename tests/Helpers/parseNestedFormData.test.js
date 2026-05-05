import { parseNestedFormData } from '@/core/Helpers/parseNestedFormData.js';

describe('parseNestedFormData Helper', () => {
    test('should parse simple key-value pairs', () => {
        const formData = new Map([
            ['name', 'Test'],
            ['age', '25']
        ]);
        const result = parseNestedFormData(formData);
        expect(result).toEqual({ name: 'Test', age: '25' });
    });

    test('should parse nested objects', () => {
        const formData = new Map([
            ['user[name]', 'Test'],
            ['user[email]', 'test@test.com']
        ]);
        const result = parseNestedFormData(formData);
        expect(result).toEqual({
            user: {
                name: 'Test',
                email: 'test@test.com'
            }
        });
    });

    test('should parse arrays', () => {
        const formData = new Map([
            ['items[0]', 'item1'],
            ['items[1]', 'item2']
        ]);
        const result = parseNestedFormData(formData);
        expect(result).toEqual({
            items: ['item1', 'item2']
        });
    });

    test('should parse nested arrays of objects', () => {
        const formData = new Map([
            ['users[0][name]', 'User1'],
            ['users[1][name]', 'User2']
        ]);
        const result = parseNestedFormData(formData);
        expect(result).toEqual({
            users: [
                { name: 'User1' },
                { name: 'User2' }
            ]
        });
    });

    test('should handle boolean and null strings', () => {
        const formData = new Map([
            ['isActive', 'true'],
            ['isPending', 'false'],
            ['data', 'null']
        ]);
        const result = parseNestedFormData(formData);
        expect(result.isActive).toBe(true);
        expect(result.isPending).toBe(false);
        expect(result.data).toBe(null);
    });

    test('should handle array suffix notation', () => {
        // Simulating duplicate keys which FormData supports but Map doesn't
        const mockFormData = {
            entries: () => [
                ['tags[]', 'tag1'],
                ['tags[]', 'tag2']
            ][Symbol.iterator]()
        };
        const result = parseNestedFormData(mockFormData);
        expect(result.tags).toEqual(['tag1', 'tag2']);
    });
});
