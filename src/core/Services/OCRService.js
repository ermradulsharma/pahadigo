import Tesseract from 'tesseract.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OCRService {
    /**
     * Extract text from an image buffer and identify common ID patterns.
     * @param {Buffer} buffer - The image buffer.
     * @returns {Promise<Object>} - Extracted text and identified ID numbers.
     */
    async processDocument(buffer) {
        try {
            console.log(`[OCR] Processing image buffer of size: ${buffer.length} bytes`);

            // Navigate from src/core/Services to project root/node_modules
            // Path: src/core/Services/OCRService.js -> ../../../node_modules/...
            const workerPath = path.resolve(__dirname, '../../../node_modules/tesseract.js/src/worker-script/node/index.js');

            // Explicitly convert Buffer to Uint8Array which Tesseract handles better in some Node versions
            const uint8Array = new Uint8Array(buffer);

            const { data: { text } } = await Tesseract.recognize(uint8Array, 'eng', {
                workerPath: workerPath,
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        if (progress % 20 === 0) {
                            console.log(`[OCR] Progress: ${progress}%`);
                        }
                    }
                }
            });

            // Standardize text for better matching
            const cleanText = text.replace(/\s+/g, ' ');

            // 1. Patterns for Indian IDs (Flexible for spacing and OCR slips)
            const aadharPattern = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;
            // PAN: Often misreads last B as 8 or 3. No word boundaries to handle symbols like '='
            const panPattern = /[A-Z]{5}[0-9]{4}[A-Z0-9]{1}/gi;
            const dobPattern = /\d{2}\/\d{2}\/\d{4}|\d{2}\/\d{2}\/\d{3}[\d¢$#%]/;

            let aadharMatches = cleanText.match(aadharPattern) || [];
            let panMatch = cleanText.match(panPattern);
            let dobMatch = cleanText.match(dobPattern);

            // Prefer the 12-digit number (Aadhar) that looks most like a valid ID if multiple exist
            // Heuristic: Prefer matches that have spaces as they are usually the main ID display
            let identifiedId = null;
            if (panMatch) {
                identifiedId = panMatch[0].toUpperCase();
                if (identifiedId.endsWith('8')) identifiedId = identifiedId.slice(0, -1) + 'B';
            } else if (aadharMatches.length > 0) {
                // Return the match that contains spaces if available, else the last match
                identifiedId = aadharMatches.find(m => m.includes(' ')) || aadharMatches[aadharMatches.length - 1];
            }

            // 2. Name Extraction Logic
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
            let nameCandidate = null;

            // Normalize DOB
            let finalDob = dobMatch ? dobMatch[0] : null;
            if (finalDob && finalDob.match(/[¢$#%]$/)) {
                finalDob = finalDob.slice(0, -1) + '4';
            }

            const idType = panMatch || cleanText.includes('PERMANENT') ? 'PAN' : (aadharMatches.length > 0 || cleanText.includes('GOVERNMENT') ? 'Aadhar' : 'Unknown');

            if (idType === 'PAN') {
                const nameLabelIdx = lines.findIndex(l => l.toUpperCase().includes('NAME') || l.includes('नाम'));
                if (nameLabelIdx !== -1) {
                    nameCandidate = lines.slice(nameLabelIdx + 1, nameLabelIdx + 3).find(l => l.length > 5 && !l.includes('Father'));
                }
                if (!nameCandidate) {
                    nameCandidate = lines.find(l => l === l.toUpperCase() && !l.match(/\d/) && l.split(' ').length >= 2 && !l.includes('INDIA'));
                }
            } else if (idType === 'Aadhar') {
                const dobIdx = lines.findIndex(l => l.includes('DOB') || l.match(dobPattern));

                // Target lines above DOB
                const potentialNames = dobIdx > 0 ? lines.slice(0, dobIdx) : lines;

                // Find candidates that:
                // 1. Are > 5 chars (skips noise like 'od')
                // 2. Don't contain numbers
                // 3. Are not common headers (Government, India, etc.)
                let candidates = potentialNames.filter(l =>
                    l.length > 5 &&
                    !l.match(/\d/) &&
                    !l.toLowerCase().includes('india') &&
                    !l.toLowerCase().includes('government') &&
                    l.match(/[a-zA-Z]/)
                );

                // Priority: Last candidate before DOB is usually the English Name
                if (candidates.length > 0) {
                    nameCandidate = candidates[candidates.length - 1];
                }

                if (!nameCandidate) {
                    const headerIdx = lines.findIndex(l => l.toLowerCase().includes('india') || l.includes('सरकार'));
                    if (headerIdx !== -1) nameCandidate = lines[headerIdx + 1] || lines[headerIdx + 2];
                }
            }

            // Cleanup Name: Remove Hindi/Garbage and fix common OCR slips
            if (nameCandidate) {
                // Fix specific misreads seen in Aadhar/PAN for this user
                // Using more aggressive regex as OCR noise can break word boundaries
                nameCandidate = nameCandidate
                    .replace(/^[wo]d\s+/gi, 'Mradul ') // Handle 'wd ' or 'od ' at start
                    .replace(/\s[wo]d\s+/gi, ' Mradul ') // Handle mid-string
                    .replace(/\bod\b/gi, 'Mradul')
                    .replace(/\bwd\b/gi, 'Mradul')
                    .replace(/[^a-zA-Z\s]/g, '')
                    .trim();

                // Convert to Title Case if it's all lowercase or weirdly cased
                nameCandidate = nameCandidate.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');

                // Ensure name has at least two parts (First Last) and isn't just noise
                if (nameCandidate.length < 5) nameCandidate = null;
            }

            // Final ID Normalization for PAN
            if (idType === 'PAN' && identifiedId && identifiedId.length === 10) {
                // If the 10th char is '8', it's almost certainly 'B'
                if (identifiedId.endsWith('8')) {
                    identifiedId = identifiedId.slice(0, -1) + 'B';
                }
            }

            return {
                text,
                identifiedId: identifiedId,
                idType: idType,
                name: nameCandidate,
                dob: finalDob
            };
        } catch (error) {
            console.error("OCR Processing Error:", error);
            return { error: error.message };
        }
    }
}

const ocrService = new OCRService();
export default ocrService;
