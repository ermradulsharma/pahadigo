import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('InvoiceDocument Template', () => {
    it('should exist as a JSX file', () => {
        // Since testing JSX requires Babel/React setup which is not present in Node Jest context,
        // we verify the file exists and is accessible.
        const templatePath = path.resolve(process.cwd(), 'src/core/Templates/Pdf/InvoiceDocument.jsx');
        expect(fs.existsSync(templatePath)).toBe(true);
    });
});
