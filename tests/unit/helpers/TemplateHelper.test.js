import { renderTemplate } from '../../../src/core/Helpers/TemplateHelper.js';
import fs from 'fs/promises';
import { jest } from '@jest/globals';

describe('TemplateHelper Helper Test Suite', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should replace placeholders in template', async () => {
        jest.spyOn(fs, 'readFile').mockResolvedValue('Hello {{NAME}}, your code is {{CODE}}.');
        
        const result = await renderTemplate('test.html', { NAME: 'Rahul', CODE: '123' });
        
        expect(result).toBe('Hello Rahul, your code is 123.');
    });

    it('should throw error if file reading fails', async () => {
        jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('File not found'));
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        await expect(renderTemplate('fail.html')).rejects.toThrow();
        errorSpy.mockRestore();
    });
});
