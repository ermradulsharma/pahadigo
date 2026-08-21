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
