/*******************************************************
                   Card: Transactions
********************************************************/

import { graphQLService, QUERIES } from "../logic/graphQL.js";

// Fetches and renders the user's transaction list
export const renderTransactions = async () => {
    // Transaction data holder
    let transactionData = null;
    
    try {
        // Get auth token
        const token = localStorage.getItem("JWT");
        
        // Fetch transaction data
        transactionData = await fetchTransactionData(token);
    } catch (error) {
        console.error("Failed to render transactions list:", error);
        return;
    }
    
    // Render the transactions to the UI
    renderTransactionsToUI(transactionData);
};

/**
 * Fetches transaction data from the GraphQL service
 * @param {string} token - Authentication token
 * @returns {Promise<Array>} - Array of transaction objects
 */
async function fetchTransactionData(token) {
    let data = [];
    
    const response = await graphQLService.execute(QUERIES.USER_TRANSACTIONS, {}, token);
    
    // Handle errors in response
    if (Array.isArray(response.errors)) {
        throw response.errors[0].message;
    }
    
    // Validate and process response data
    if (response && Array.isArray(response.data.user[0].transactions)) {
        // Filter out any in-middle checkpoint exercises (less than 5000)
        data = response.data.user[0].transactions.filter(tx => tx.amount >= 5000);
    } else {
        throw new Error("Invalid data received!");
    }
    
    return data;
}

/**
 * Renders transaction data to the UI
 * @param {Array} transactions - Array of transaction objects
 */
function renderTransactionsToUI(transactions) {
    const container = document.getElementById("last-transactions-info");
    
    if (!container) return;
    
    container.innerHTML = `
    <div class="card-header"></div>
    <h2 class="card-title">Transactions List</h2>
    <div class="last-transactions-info-container">
        ${transactions.map(transaction => `
            <div class="transaction-item">
                <span class="name">${transaction.object.name}</span>
                <span class="amount">${transaction.amount/1000} KB</span>
                <span class="date">${new Date(transaction.createdAt).toLocaleDateString()}</span>
            </div>
        `).join('')}
    </div>
    `;
}