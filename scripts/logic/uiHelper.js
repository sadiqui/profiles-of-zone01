/**
 * UI Helper functions
 * Common utilities for UI manipulation and formatting
 */

/**
 * Display an error message in the specified element
 * @param {String} elementId - Target element ID
 * @param {String} message - Error message to display
 */
export const displayError = (elementId, message) => {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
    }
};

/**
 * Clear an error message from the specified element
 * @param {String} elementId - Target element ID
 */
export const clearError = (elementId) => {
    displayError(elementId, "");
};

/**
 * Create an SVG element with attributes
 * @param {String} name - Element tag name
 * @param {Object} attributes - Element attributes
 * @returns {SVGElement} Created SVG element
 */
export const createSvgElement = (name, attributes = {}) => {
    const svgNS = "http://www.w3.org/2000/svg";
    const element = document.createElementNS(svgNS, name);

    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });

    return element;
};

/**
 * Get maximum amount per skill from transactions
 * @param {Array} transactions - Transaction data
 * @returns {Map} Map of skills with max amounts
 */
export const getMaxAmountPerSkill = (transactions) => {
    const maxSkillMap = new Map();

    transactions.forEach((transaction) => {
        const { type, amount } = transaction;

        if (!maxSkillMap.has(type) || maxSkillMap.get(type) < amount) {
            maxSkillMap.set(type, amount);
        }
    });

    return maxSkillMap;
};