/**
 * Utility functions for mathematical operations and decimal precision formatting.
 */

/**
 * Rounds a number or numeric string to a specified number of decimal places (default: 2).
 * Handles floating point precision issues (IEEE 754) using Number.EPSILON.
 *
 * @param {number|string} val - Input number or string representation
 * @param {number} [decimals=2] - Number of decimal places to round to
 * @returns {number} Precision rounded number
 */
export function roundToDecimal(val, decimals = 2) {
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Convenience helper to round any value to 2 decimal places.
 *
 * @param {number|string} val - Input value
 * @returns {number} Value rounded to 2 decimal places
 */
export function toFixed2(val) {
    return roundToDecimal(val, 2);
}

/**
 * Format a number or numeric string as Indian Rupee (INR) currency standard.
 * Examples: 1500 -> "₹1,500.00", 250000 -> "₹2,50,000.00"
 *
 * @param {number|string} amount - Input amount in INR
 * @param {Object} [options={}] - Options (e.g. { showDecimals: true, symbol: true })
 * @returns {string} Formatted INR currency string
 */
export function formatINR(amount, options = {}) {
    const num = parseFloat(amount);
    if (isNaN(num)) return options.symbol !== false ? '₹0.00' : '0.00';
    const showDecimals = options.showDecimals !== false;
    return new Intl.NumberFormat('en-IN', {
        style: options.symbol !== false ? 'currency' : 'decimal',
        currency: 'INR',
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(num);
}
