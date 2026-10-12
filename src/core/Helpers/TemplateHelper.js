import fs from 'fs/promises';
import path from 'path';

const templateCache = new Map();

/**
 * Helper to render HTML templates with dynamic data.
 * @param {String} templatePath - Path to the template file relative to core/Templates
 * @param {Object} data - Key-value pairs to replace in the template (e.g., { OTP: '123456' })
 */
export const renderTemplate = async (templateName, data = {}) => {
  try {
    let templateContent = templateCache.get(templateName);
    if (!templateContent) {
      const rootPath = path.resolve(process.cwd(), 'src/core/Templates');
      const filePath = path.join(rootPath, templateName);
      templateContent = await fs.readFile(filePath, 'utf8');
      templateCache.set(templateName, templateContent);
    }

    // Automatic defaults
    const currentYear = data.YEAR || new Date().getFullYear();
    let rendered = templateContent.replace(/{{YEAR}}/g, currentYear);

    // Simple string replacement: {{KEY}} -> value
    Object.keys(data).forEach(key => {
      if (key !== 'YEAR') {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, data[key]);
      }
    });

    return rendered;
  } catch (error) {
    throw new Error("Failed to render email template.");
  }
};

export default { renderTemplate };

