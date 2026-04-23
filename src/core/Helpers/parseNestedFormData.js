import { DEFAULTS } from "@/core/Constants/index.js";
export function parseNestedFormData(formData) {
    const result = {};

    for (const [key, value] of formData.entries()) {
        const parts = key.split(/[\[\]]+/).filter(Boolean);
        let current = result;

        // Helper to clean and convert values
        let cleanedValue = value;
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === 'true') cleanedValue = DEFAULTS.TRUE;
            else if (trimmed === 'false') cleanedValue = DEFAULTS.FALSE;
            else if (trimmed === 'null') cleanedValue = DEFAULTS.NULL;
            else if (trimmed === 'undefined') cleanedValue = DEFAULTS.UNDEFINED;
            // Removed automatic number conversion to preserve strings like phone numbers/pincodes
            else cleanedValue = trimmed;
        }

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;

            if (isLast) {
                if (key.endsWith('[]')) {
                    if (!current[part]) current[part] = [];
                    current[part].push(cleanedValue);
                } else {
                    current[part] = cleanedValue;
                }
            } else {
                const nextPart = parts[i + 1];
                const isNextNumber = /^\d+$/.test(nextPart);

                if (!current[part]) {
                    current[part] = isNextNumber ? [] : {};
                }
                current = current[part];
            }
        }
    }

    return result;
}

export default parseNestedFormData;
