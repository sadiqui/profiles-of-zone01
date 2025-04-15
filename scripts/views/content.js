/*******************************************************
                      Show Projects
********************************************************/

import { logout } from "../logic/authManager.js"
import { fetchGraphQL } from "../logic/graphQL.js";
import { GET_USER_TRANSACTIONS } from "../logic/graphQL.js";
import { GET_USER_LEVEL } from "../logic/graphQL.js";
import { GET_USER_AUDITS } from "../logic/graphQL.js";

export const renderTransactionsList = async () => {
    // Fetch transactions info
    const token = localStorage.getItem("JWT");
    let data

    await fetchGraphQL(GET_USER_TRANSACTIONS, {}, token)
        .then((response) => {
            if (Array.isArray(response.errors)) {
                throw response.errors[0].message;
            }

            if (response && Array.isArray(response.data.user[0].transactions)) {
                // Filter out any in-middle checkpoint exercises
                data = response.data.user[0].transactions.filter(tx => tx.amount >= 5000)
            } else {
                throw new Error("Invalid data received!");
            }
        })
        .catch((error) => {
            if (typeof error === "string" && error.includes('JWTExpired')) logout();
            console.error(error);
        });


    // Render transactions info
    const container = document.getElementById("last-transactions-info");
    container.innerHTML = `
    <div class="card-header"></div>
    <h2 class="card-title">Transactions List</h2>
    <div class="last-transactions-info-container">
        ${data.map(transaction => `
            <div class="transaction-item">
                <span class="name">${transaction.object.name}</span>
                <span class="amount">${transaction.amount/1000} KB</span>
                <span class="date">${new Date(transaction.createdAt).toLocaleDateString()}</span>
            </div>
        `).join('')}
    </div>
`;
}

/*******************************************************
                      Show level
********************************************************/

export const renderCurrentLevel = async () => {
    // Fetch level info
    const token = localStorage.getItem("JWT");
    let data

    await fetchGraphQL(GET_USER_LEVEL, {}, token)
        .then((response) => {
            if (Array.isArray(response.errors)) {
                throw response.errors[0].message;
            }

            if (response && Array.isArray(response.data.transaction)) {
                data = response.data.transaction[0].amount
            } else {
                throw new Error("Invalid data received!");
            }
        })
        .catch((error) => {
            if (typeof error === "string" && error.includes('JWTExpired')) logout();
            console.error(error);
        });

    // Render level info
    const container = document.getElementById("level-info");
    container.innerHTML = `
    <div class="card-header"></div>
    <h2 class="card-title">Current Level</h2>
    <div class="level-info-container">
        <span>${data}</span>
    </div>
    `;
}

/*******************************************************
                      Show audits info
********************************************************/

export const renderUserAudits = async () => {
    // Fetch audits info
    const token = localStorage.getItem("JWT");
    let data

    await fetchGraphQL(GET_USER_AUDITS, {}, token)
        .then((response) => {
            if (Array.isArray(response.errors)) {
                throw response.errors[0].message;
            }

            data = response?.data.user[0];
            if (!response && typeof data !== 'object') {
                throw new Error("Invalid data received!");
            }
        })
        .catch((error) => {
            if (typeof error === "string" && error.includes('JWTExpired')) logout();
            console.error(error);
        });


    const succeeded = data.audits_aggregate.aggregate.count
    const failed = data.failed_audits.aggregate.count
    const total = succeeded + failed

    const succeededPercentage = (succeeded / total) * 100
    const failedPercentage = (failed / total) * 100

    // Render audit info
    const container = document.getElementById("audits-info");
    container.innerHTML = `
    <div class="card-header"></div>
    <h2 class="card-title">Audits You Done</h2>
    <div class="audits-grid">
        <div class="audit-card">
            <span class="audit-number">${(data.auditRatio).toFixed(1)}</span>
            <span class="audit-label">Audits Ratio</span>
        </div>
        <div class="audit-card">
            <span class="audit-number">${total}</span>
            <span class="audit-label">Total Audits</span>
        </div>
        <div class="audit-card">
            <span class="audit-number success-value">${(succeededPercentage).toFixed(1)} %</span>
            <span class="audit-label">Succeeded</span>
        </div>
        <div class="audit-card">
            <span class="audit-number danger-value">${(failedPercentage).toFixed(1)} %</span>
            <span class="audit-label">Failed</span>
        </div>
    </div>
    `;
}
