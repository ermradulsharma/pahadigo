import { jest } from '@jest/globals';
import OCRService from '../../../src/core/Services/OCRService.js';
import Tesseract from 'tesseract.js';

describe('OCRService Test Suite', () => {

    beforeEach(() => {
        jest.spyOn(Tesseract, 'recognize').mockResolvedValue({
            data: { text: '' }
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should extract PAN details correctly', async () => {
        // Mock Tesseract to return a simulated PAN card string
        Tesseract.recognize.mockResolvedValue({
            data: {
                text: 'GOVERNMENT OF INDIA\nNAME\nMradul Sharma\nDOB 01/01/1990\nABCDE1234F'
            }
        });

        const buffer = Buffer.from('dummy image data');
        const result = await OCRService.processDocument(buffer);

        expect(Tesseract.recognize).toHaveBeenCalled();
        expect(result.idType).toBe('PAN');
        expect(result.identifiedId).toBe('ABCDE1234F');
        expect(result.name).toBe('Mradul Sharma');
        expect(result.dob).toBe('01/01/1990');
    });

    it('should extract Aadhar details correctly', async () => {
        // Mock Tesseract to return a simulated Aadhar card string
        // Note: Aadhar numbers officially start with 2-9
        Tesseract.recognize.mockResolvedValue({
            data: {
                text: 'Government of India\nJohn Doe\nDOB: 15/08/1985\n2234 5678 9012\nMale'
            }
        });

        const buffer = Buffer.from('dummy aadhar data');
        const result = await OCRService.processDocument(buffer);

        expect(Tesseract.recognize).toHaveBeenCalled();
        expect(result.idType).toBe('Aadhar');
        expect(result.identifiedId).toBe('2234 5678 9012');
        expect(result.name).toBe('John Doe'); // Fetches name right above DOB
    });

    it('should return an error if processing fails', async () => {
        Tesseract.recognize.mockRejectedValue(new Error('Tesseract failed'));

        const buffer = Buffer.from('corrupt data');
        const result = await OCRService.processDocument(buffer);

        expect(result.error).toBeDefined();
    });
});
