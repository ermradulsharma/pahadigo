/**
 * Calculates the start date for analytics based on the requested period.
 * 
 * @param {string} period - 'yearly', 'weekly', or 'monthly' (default).
 * @returns {Date} The calculated start date.
 */
export const getStartDateByPeriod = (period = 'monthly') => {
    const now = new Date();
    let startDate;

    if (period === 'yearly') {
        startDate = new Date(now.getFullYear(), 0, 1);
    } else if (period === 'weekly') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    } else {
        // Default: Monthly (Last 30 days)
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }

    return startDate;
};

export const dateFormat = (date) => {
    if (!date) return null;
    return new Date(date)?.toISOString()?.split('T')?.[0];
};

/**
 * Format a Date, timestamp, or ISO string to Indian Standard Time (IST - Asia/Kolkata).
 * 
 * @param {Date|string|number} date - Input date
 * @param {Object} [options={}] - Options (e.g. { includeTime: true, includeSeconds: false })
 * @returns {string} Formatted IST date string
 */
export const formatIST = (date, options = {}) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const dateOptions = {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    };

    if (options.includeTime) {
        dateOptions.hour = '2-digit';
        dateOptions.minute = '2-digit';
        if (options.includeSeconds) dateOptions.second = '2-digit';
        dateOptions.hour12 = true;
    }

    return new Intl.DateTimeFormat('en-IN', dateOptions).format(d);
};

export default { getStartDateByPeriod, dateFormat, formatIST };
