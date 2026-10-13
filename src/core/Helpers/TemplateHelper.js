import fs from 'fs/promises';
import path from 'path';

const templateCache = new Map();

export const clearTemplateCache = () => {
  templateCache.clear();
};

/**
 * Helper to render HTML templates with dynamic data.
 * @param {String} templateName - Path to the template file relative to core/Templates
 * @param {Object} data - Key-value pairs to replace in the template
 */
export const renderTemplate = async (templateName, data = {}) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    let templateContent = isProduction ? templateCache.get(templateName) : null;
    if (!templateContent) {
      const rootPath = path.resolve(process.cwd(), 'src/core/Templates');
      const filePath = path.join(rootPath, templateName);
      templateContent = await fs.readFile(filePath, 'utf8');
      if (isProduction) {
        templateCache.set(templateName, templateContent);
      }
    }

    let rendered = templateContent;

    // Automatic defaults
    const context = {
      YEAR: new Date().getFullYear(),
      ...data
    };

    // 1. Process section blocks: {{#KEY}}...{{/KEY}}
    rendered = rendered.replace(/{{#([a-zA-Z0-9_]+)}}([\s\S]*?){{\/\1}}/g, (match, key, content) => {
      const value = context[key];
      if (value) {
        return content;
      }
      return '';
    });

    // 2. Simple replacements: {{KEY}} -> value
    Object.keys(context).forEach(key => {
      const val = context[key];
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, (val !== undefined && val !== null) ? val : '');
    });

    // 3. Clean up any remaining unreplaced placeholders: {{ANY_KEY}} -> ''
    rendered = rendered.replace(/{{[#\/]?[a-zA-Z0-9_]+}}/g, '');

    return rendered;
  } catch (error) {
    throw new Error("Failed to render email template.");
  }
};

export default { renderTemplate, clearTemplateCache };


