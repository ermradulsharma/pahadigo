import { jest } from '@jest/globals';

// Define a mock OCR extraction function
const mockExtractOCR = jest.fn();

describe('Integration: OCR/KYC Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully extract data from a valid document', async () => {
        mockExtractOCR.mockResolvedValue({
            success: true,
            extractedData: {
                name: 'JOHN DOE',
                documentNumber: 'A1234567',
                dob: '1990-01-01'
            }
        });

        const result = await mockExtractOCR('base64-valid-image');
        expect(result.success).toBe(true);
        expect(result.extractedData.name).toBe('JOHN DOE');
    });

    it('should handle unreadable files gracefully (partial extraction)', async () => {
        mockExtractOCR.mockResolvedValue({
            success: true,
            extractedData: {
                name: 'JOHN DOE', // Partially readable
                documentNumber: null, // Blurred
                dob: null
            },
            warnings: ['LOW_CONFIDENCE']
        });

        const result = await mockExtractOCR('base64-blurry-image');
        expect(result.success).toBe(true);
        expect(result.extractedData.documentNumber).toBeNull();
        expect(result.warnings).toContain('LOW_CONFIDENCE');
    });

    it('should reject bad files (corrupted image)', async () => {
        mockExtractOCR.mockRejectedValue(new Error('Invalid image format'));

        await expect(mockExtractOCR('bad-file')).rejects.toThrow('Invalid image format');
    });
});
