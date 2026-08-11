import { jest } from '@jest/globals';

const mockRecognize = jest.fn();

jest.unstable_mockModule('tesseract.js', () => ({
    default: {
        recognize: mockRecognize
    }
}));

jest.unstable_mockModule('@/core/Helpers/AppError.js', () => ({
    default: class AppError extends Error {
        constructor(msg, code) {
            super(msg);
            this.code = code;
        }
    }
}));

const { default: OCRService } = await import('@/core/Services/Admin/OCRService.js');

describe('OCRService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('processDocument', () => {
        it('should correctly process and identify a PAN card', async () => {
            mockRecognize.mockResolvedValue({
                data: { text: "INCOME TAX DEPARTMENT \n JOHN DOE \n 01/01/1990 \n ABCDE1234F" }
            });
            const result = await OCRService.processDocument(Buffer.from('dummy'));
            
            expect(result.idType).toBe('PAN');
            expect(result.identifiedId).toBe('ABCDE1234F');
            expect(result.dob).toBe('01/01/1990');
            expect(result.name).toBe('JOHN DOE');
            expect(result.error).toBe(false);
        });

        it('should correctly process and identify an Aadhaar card', async () => {
            mockRecognize.mockResolvedValue({
                data: { text: "GOVERNMENT OF INDIA \n JANE SMITH \n DOB: 15-08-1985 \n 1234 5678 9012" }
            });
            const result = await OCRService.processDocument(Buffer.from('dummy'));
            
            expect(result.idType).toBe('AADHAAR');
            expect(result.identifiedId).toBe('123456789012');
            expect(result.dob).toBe('15-08-1985');
            expect(result.name).toBe('JANE SMITH');
        });

        it('should correctly extract YOB fallback for Aadhaar', async () => {
            mockRecognize.mockResolvedValue({
                data: { text: "GOVERNMENT OF INDIA \n YEAR OF BIRTH: 1985 \n 1234 5678 9012" }
            });
            const result = await OCRService.processDocument(Buffer.from('dummy'));
            expect(result.dob).toBe('1985');
        });

        it('should process Voter ID', async () => {
            mockRecognize.mockResolvedValue({
                data: { text: "ELECTION COMMISSION \n NAME \n ABC1234567" }
            });
            const result = await OCRService.processDocument(Buffer.from('dummy'));
            expect(result.idType).toBe('VOTER_ID');
            expect(result.identifiedId).toBe('ABC1234567');
        });

        it('should process Passport', async () => {
            mockRecognize.mockResolvedValue({
                data: { text: "REPUBLIC OF INDIA \n PASSPORT \n A1234567" }
            });
            const result = await OCRService.processDocument(Buffer.from('dummy'));
            expect(result.idType).toBe('PASSPORT');
            expect(result.identifiedId).toBe('A1234567');
        });

        it('should process Driving License', async () => {
            mockRecognize.mockResolvedValue({
                data: { text: "TRANSPORT DEPARTMENT \n DL14 20200000000" }
            });
            const result = await OCRService.processDocument(Buffer.from('dummy'));
            expect(result.idType).toBe('DRIVING_LICENSE');
            expect(result.identifiedId).toBe('DL1420200000000');
        });

        it('should fallback for unknown ID with no clear markers', async () => {
            mockRecognize.mockResolvedValue({
                data: { text: "SOME ORG \n ALICE SMITH \n ID: X8Y9Z10ABC" }
            });
            const result = await OCRService.processDocument(Buffer.from('dummy'));
            expect(result.idType).toBe('ID_CARD');
            expect(result.identifiedId).toBe('X8Y9Z10ABC');
            expect(result.name).toBe('SOME ORG');
        });

        it('should handle OCR failures and throw AppError', async () => {
            mockRecognize.mockRejectedValue(new Error('Tesseract failure'));
            await expect(OCRService.processDocument(Buffer.from('dummy')))
                .rejects.toThrow('OCR Processing failed: Tesseract failure');
        });
    });
});
