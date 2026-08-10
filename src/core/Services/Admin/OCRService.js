import Tesseract from 'tesseract.js';
import AppError from '@/core/Helpers/AppError.js';
/**
 * OCRService - Specialized service for document text extraction using Tesseract.js.
 */
class OCRService {
    async processDocument(buffer) {
        try {
            const { data: { text } } = await Tesseract.recognize(
                buffer,
                'eng'
            );

            // Clean up the text for easier matching
            const cleanText = text.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').toUpperCase();

            const idType = this._identifyDocumentType(cleanText);
            const idNumber = this._extractIDNumber(cleanText, idType);
            const dob = this._extractDOB(cleanText);
            const name = this._extractName(cleanText, idType);

            return {
                text,
                idType,
                name,
                dob,
                identifiedId: idNumber,
                error: false
            };
        } catch (error) {
            throw new AppError(`OCR Processing failed: ${error.message}`, 500);
        }
    }

    _identifyDocumentType(text) {
        if (text.includes('AADHAAR') || text.includes('GOVERNMENT OF INDIA') || text.includes('UIDAI')) return 'AADHAAR';
        if (text.includes('INCOME TAX DEPARTMENT') || text.includes('PAN') || /[A-Z]{5}[0-9]{4}[A-Z]{1}/.test(text)) return 'PAN';
        if (text.includes('ELECTION COMMISSION') || text.includes('VOTER ID')) return 'VOTER_ID';
        if (text.includes('DRIVING LICENCE') || text.includes('TRANSPORT DEPARTMENT')) return 'DRIVING_LICENSE';
        if (text.includes('REPUBLIC OF INDIA') || text.includes('PASSPORT')) return 'PASSPORT';
        return 'ID_CARD';
    }

    _extractIDNumber(text, type) {
        let match;
        switch (type) {
            case 'PAN':
                match = text.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/);
                break;
            case 'AADHAAR':
                // Aadhaar format: 12 digits, often formatted as 4-4-4
                match = text.match(/(?<!\S)(?:\d{4}\s\d{4}\s\d{4}|\d{12})(?!\S)/);
                break;
            case 'VOTER_ID':
                // Typical voter ID: 3 letters followed by 7 digits
                match = text.match(/[A-Z]{3}[0-9]{7}/);
                break;
            case 'PASSPORT':
                // Passport: 1 letter followed by 7 digits
                match = text.match(/[A-Z]{1}[0-9]{7}/);
                break;
            case 'DRIVING_LICENSE':
                // DL: State code (2) + 13 digits
                match = text.match(/[A-Z]{2}[0-9]{13}|[A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{11}/);
                break;
            default:
                // Generic fallback for any obvious ID-like string
                match = text.match(/[A-Z0-9]{8,15}/);
        }
        return match ? match[0].replace(/\s/g, '') : 'UNKNOWN';
    }

    _extractDOB(text) {
        // Matches standard Indian dates like DD/MM/YYYY, DD-MM-YYYY
        const dobMatch = text.match(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/);
        if (dobMatch) return dobMatch[0];

        // Fallback for YOB (Year of Birth) often found in Aadhaar
        const yobMatch = text.match(/(?:YOB|YEAR OF BIRTH)\s*[:\-]?\s*(\d{4})/i);
        return yobMatch ? yobMatch[1] : null;
    }

    _extractName(text, type) {
        // Extracting name from OCR is notoriously difficult without ML.
        // We use heuristics based on document type patterns.
        if (type === 'PAN') {
            // Name typically appears after "INCOME TAX DEPARTMENT" or before Father's Name
            const lines = text.split(/(?:INCOME TAX DEPARTMENT|GOVT\. OF INDIA)/);
            if (lines.length > 1) {
                const words = lines[1].trim().split(' ').slice(0, 3).filter(w => /^[A-Z]+$/.test(w) && w.length > 1);
                if (words.length) return words.join(' ');
            }
        }
        
        // Aadhaar often has name preceding DOB
        const dobMatchIndex = text.search(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/);
        if (dobMatchIndex > 0) {
            const beforeDob = text.substring(0, dobMatchIndex).split(' ').slice(-4);
            const nameWords = beforeDob.filter(w => /^[A-Z]+$/.test(w) && w.length > 2);
            if (nameWords.length) return nameWords.join(' ');
        }

        // Generic fallback: take the first few purely alphabetical words that are > 2 chars
        const genericWords = text.split(' ').filter(w => /^[A-Z]+$/.test(w) && w.length > 2);
        return genericWords.length >= 2 ? `${genericWords[0]} ${genericWords[1]}` : 'UNKNOWN';
    }
}

export default new OCRService();
