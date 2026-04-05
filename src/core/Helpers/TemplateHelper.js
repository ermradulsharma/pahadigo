import fs from 'fs/promises';
import path from 'path';

/**
 * Helper to render HTML templates with dynamic data.
 * @param {String} templatePath - Path to the template file relative to core/Templates
 * @param {Object} data - Key-value pairs to replace in the template (e.g., { OTP: '123456' })
 */
export const renderTemplate = async (templateName, data = {}) => {
    try {
        const rootPath = path.resolve(process.cwd(), 'src/core/Templates');
        const filePath = path.join(rootPath, templateName);
        
        let templateContent = await fs.readFile(filePath, 'utf8');

        // Automatic defaults
        data.YEAR = data.YEAR || new Date().getFullYear();

        // Simple string replacement: {{KEY}} -> value
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            templateContent = templateContent.replace(regex, data[key]);
        });

        return templateContent;
    } catch (error) {
        console.error("[TemplateHelper] Error rendering template:", error);
        throw new Error("Failed to render email template.");
    }
};
