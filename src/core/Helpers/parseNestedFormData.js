export function parseNestedFormData(formData) {
    const result = {};

    for (const [key, value] of formData.entries()) {
        const parts = key.split(/[\[\]]+/).filter(Boolean);
        let current = result;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;

            if (isLast) {
                if (key.endsWith('[]')) {
                    if (!current[part]) current[part] = [];
                    current[part].push(value);
                } else {
                    current[part] = value;
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
