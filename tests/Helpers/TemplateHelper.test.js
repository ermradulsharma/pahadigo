import { jest } from '@jest/globals';
import { renderTemplate } from '@/core/Helpers/TemplateHelper.js';
import fs from 'fs/promises';

describe('TemplateHelper', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(fs, 'readFile');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should replace double curly brace placeholders with data', async () => {
        const templateContent = 'Hello {{NAME}}, your OTP is {{OTP}}. Copyright {{YEAR}}.';
        fs.readFile.mockResolvedValue(templateContent);

        const data = { NAME: 'John', OTP: '123456' };
        const result = await renderTemplate('otp.html', data);

        expect(result).toContain('Hello John');
        expect(result).toContain('your OTP is 123456');
        expect(result).toContain(new Date().getFullYear().toString());
    });

    test('should throw error if file reading fails', async () => {
        fs.readFile.mockRejectedValue(new Error('File not found'));
        await expect(renderTemplate('missing.html')).rejects.toThrow('Failed to render email template.');
    });

    test('should handle multiple occurrences of the same key', async () => {
        const templateContent = '{{VAL}} and {{VAL}}';
        fs.readFile.mockResolvedValue(templateContent);

        const result = await renderTemplate('test.html', { VAL: 'foo' });
        expect(result).toBe('foo and foo');
    });
});
