/*******************************************************
                   Card: Audits
********************************************************/

import { graphQLService, QUERIES } from "../logic/graphQL.js";

// Fetches and renders the user's audit information
export const renderAudits = async () => {
    // Audit data holder
    let userData = null;
    
    try {
        // Get auth token
        const token = localStorage.getItem("JWT");
        
        // Fetch audit data
        userData = await fetchAuditData(token);
    } catch (error) {
        console.error("Failed to render user audits:", error);
        return;
    }
    
    // Process audit statistics
    const auditStats = calculateAuditStatistics(userData);
    
    // Render the audits to the UI
    renderAuditsToUI(userData, auditStats);
};

/**
 * Fetches audit data from the GraphQL service
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - User audit data
 */
async function fetchAuditData(token) {
    const response = await graphQLService.execute(QUERIES.USER_AUDITS, {}, token);
    
    // Handle errors in response
    if (Array.isArray(response.errors)) {
        throw response.errors[0].message;
    }
    
    // Validate response data
    const userData = response?.data.user[0];
    if (!response || typeof userData !== 'object') {
        throw new Error("Invalid data received!");
    }
    
    return userData;
}

/**
 * Calculates audit statistics from user data
 * @param {Object} userData - User audit data
 * @returns {Object} - Calculated audit statistics
 */
function calculateAuditStatistics(userData) {
    const succeeded = userData.audits_aggregate.aggregate.count;
    const failed = userData.failed_audits.aggregate.count;
    const total = succeeded + failed;
    
    const succeededPercentage = (succeeded / total) * 100;
    const failedPercentage = (failed / total) * 100;
    
    return {
        succeeded,
        failed,
        total,
        succeededPercentage,
        failedPercentage
    };
}

/**
 * Renders audit data to the UI
 * @param {Object} userData - User audit data
 * @param {Object} stats - Calculated audit statistics
 */
function renderAuditsToUI(userData, stats) {
    const container = document.getElementById("audits-info");
    
    if (!container) return;
    
    container.innerHTML = `
    <div class="card-header"></div>
    <h2 class="card-title">Audits You Done</h2>
    <div class="audits-grid">
        <div class="audit-card">
            <span class="audit-number">${(userData.auditRatio).toFixed(1)}</span>
            <span class="audit-label">Audits Ratio</span>
        </div>
        <div class="audit-card">
            <span class="audit-number">${stats.total}</span>
            <span class="audit-label">Total Audits</span>
        </div>
        <div class="audit-card">
            <span class="audit-number success-value">${(stats.succeededPercentage).toFixed(1)} %</span>
            <span class="audit-label">Succeeded</span>
        </div>
        <div class="audit-card">
            <span class="audit-number danger-value">${(stats.failedPercentage).toFixed(1)} %</span>
            <span class="audit-label">Failed</span>
        </div>
    </div>
    `;
}