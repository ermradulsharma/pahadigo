import { createWorker } from 'tesseract.js';

class OCRService {
    /**
     * Extract text from an image buffer and identify common ID patterns.
     * @param {Buffer} buffer - The image buffer.
     * @returns {Promise<Object>} - Extracted text and identified ID numbers.
     */
    async processDocument(buffer) {
        let worker;
        try {
            worker = await createWorker('eng');

            // Perform OCR
            const { data: { text } } = await worker.recognize(buffer);

            // Patterns for Indian IDs
            const aadharPattern = /\b\d{4}\s\d{4}\s\d{4}\b|\b\d{12}\b/;
            const panPattern = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/;
            const dobPattern = /\d{2}\/\d{2}\/\d{4}/;

            const aadharMatch = text.match(aadharPattern);
            const panMatch = text.match(panPattern);
            const dobMatch = text.match(dobPattern);

            // Simple logic for Name: Look for lines that look like names (usually uppercase, multiple words)
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
            let nameCandidate = null;

            // In PAN, Name is often the 2nd or 3rd non-empty line
            // In Aadhar, it's usually one of the top lines
            if (panMatch) {
                // Heuristic for PAN Name (usually after "Income Tax Department")
                nameCandidate = lines.find(l => !l.includes('INCOME TAX') && !l.includes('FATHER') && !l.match(/\d/) && l === l.toUpperCase());
            } else if (aadharMatch) {
                // Heuristic for Aadhar Name (usually top lines, no numbers)
                nameCandidate = lines.find(l => !l.match(/\d/) && l.split(' ').length >= 2);
            }

            await worker.terminate();

            return {
                text,
                identifiedId: aadharMatch ? aadharMatch[0] : (panMatch ? panMatch[0] : null),
                idType: aadharMatch ? 'Aadhar' : (panMatch ? 'PAN' : 'Unknown'),
                name: nameCandidate,
                dob: dobMatch ? dobMatch[0] : null
            };
        } catch (error) {
            console.error("OCR Processing Error:", error);
            if (worker) await worker.terminate();
            return { error: error.message };
        }
    }
}

const ocrService = new OCRService();
export default ocrService;
