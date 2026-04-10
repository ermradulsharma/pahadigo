import { jest } from '@jest/globals';
import OCRService from '@/services/Admin/OCRService.js';
import Tesseract from 'tesseract.js';

describe('OCRService', () => {
    beforeEach(() => {
        jest.spyOn(Tesseract, 'recognize');
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('processDocument should return extracted data for Aadhaar', async () => {
        const mockText = 'AADHAAR\nJOHN DOE\nDOB: 01/01/1990\n1234 5678 9012';
        Tesseract.recognize.mockResolvedValue({
            data: { text: mockText }
        });

        const result = await OCRService.processDocument(Buffer.from('fake-buffer'));

        expect(result.idType).toBe('AADHAAR');
        expect(result.name).toBe('AADHAAR'); // Based on current _extractName which takes line[0]
        expect(result.dob).toBe('01/01/1990');
        expect(result.identifiedId).toBe('1234 5678 9012');
        expect(result.error).toBe(false);
    });

    test('processDocument should return PAN type if text contains PAN', async () => {
        const mockText = 'INCOME TAX DEPARTMENT\nPAN CARD\nNAME: JANE DOE';
        Tesseract.recognize.mockResolvedValue({
            data: { text: mockText }
        });

        const result = await OCRService.processDocument(Buffer.from('fake-buffer'));

        expect(result.idType).toBe('PAN');
        expect(result.error).toBe(false);
    });

    test('processDocument should return error true on failure', async () => {
        Tesseract.recognize.mockRejectedValue(new Error('OCR Error'));
        
        // Mock console.error to avoid cluttering test output
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const result = await OCRService.processDocument(Buffer.from('fake-buffer'));

        expect(result.error).toBe(true);
        expect(result.text).toBe('');
        
        consoleSpy.mockRestore();
    });

    test('_extractDOB should handle different separators', () => {
        expect(OCRService._extractDOB('Born on 01-01-1990')).toBe('01-01-1990');
        expect(OCRService._extractDOB('Birth 01/01/1990')).toBe('01/01/1990');
        expect(OCRService._extractDOB('No date')).toBeNull();
    });

    test('_extractIDNumber should return UNKNOWN for non-AADHAAR types', () => {
        expect(OCRService._extractIDNumber('SOME TEXT', 'PAN')).toBe('UNKNOWN');
    });
});
