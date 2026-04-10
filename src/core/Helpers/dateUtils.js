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

export default { getStartDateByPeriod };
