import Tesseract from 'tesseract.js';

/**
 * OCRService - Specialized service for document text extraction using Tesseract.js.
 */
class OCRService {
    async processDocument(buffer) {
        try {
            const { data: { text } } = await Tesseract.recognize(
                buffer,
                'eng',
                { logger: m => console.log(m) }
            );

            // Mock logic to extract structured data from raw OCR text
            // In a real application, this would use regex or LLM to parse fields
            const idType = text.includes('AADHAAR') ? 'AADHAAR' : text.includes('PAN') ? 'PAN' : 'ID_CARD';
            const name = this._extractName(text);
            const dob = this._extractDOB(text);
            const idNumber = this._extractIDNumber(text, idType);

            return {
                text,
                idType,
                name,
                dob,
                identifiedId: idNumber,
                error: false
            };
        } catch (error) {
            console.error('OCR Processing failed:', error);
            return { error: true, text: '' };
        }
    }

    _extractName(text) {
        // Simple mock extractor
        const lines = text.split('\n');
        return lines[0]?.trim() || "UNKNOWN";
    }

    _extractDOB(text) {
        const dobMatch = text.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
        return dobMatch ? dobMatch[0] : null;
    }

    _extractIDNumber(text, type) {
        if (type === 'AADHAAR') {
            const match = text.match(/\d{4} \d{4} \d{4}/);
            return match ? match[0] : null;
        }
        return "UNKNOWN";
    }
}

export default new OCRService();
