/*******************************************************
                   Authentication Page
********************************************************/

import { displayError } from "../logic/uiHelper.js";

export const renderLoginView = () => {
    const container = document.createElement('div');
    container.innerHTML = `
    <div class="login-container">
        <form class="login-card" id="login-form">
            <h1>Login</h1>
            <input type="text" id="username" placeholder="Username or email" required/>
            <input type="password" id="password" placeholder="Password" required/>
            <span class="error" id="login-error"></span>
            <button id="login-button" class="btn">Login <i class="fa-solid fa-right-to-bracket"></i></button>
        </form>
    </div>`;

    document.body.appendChild(container);

    // empty the error message
    document.getElementById('username')?.addEventListener("focus", () => {
        displayError("login-error", "")
    })
    document.getElementById('password')?.addEventListener("focus", () => {
        displayError("login-error", "")
    })
}

/*******************************************************
                      Profile Page
********************************************************/

import { logout } from "../logic/authManager.js";
import { renderProgressChart, renderSkillsChart } from "../logic/chartComponents.js";
import { renderCurrentLevel, renderTransactionsList, renderUserAudits } from "./content.js";

export const renderProfileView = (user) => {
    document.body.innerHTML = ``;

    // Create container
    const container = document.createElement('div');
    container.className = "main-container";
    container.innerHTML = `
    <div class="profile">
        <div class="profile-header">
            <div class="user-greeting">
                <h1>Great to see you, <span class="user-name">${user.firstName} ${user.lastName}</span>!</h1>
                <p>Let's check out what's new on your dashboard</p>
            </div>
            <button id="logout-button" class="btn logout-btn">
                <i class="fa-solid fa-right-from-bracket"></i> Logout
            </button>
        </div>
        <div class="profile-container">
            <div class="level">
                <div id="level-info" class="dashboard-card"></div>
                <div id="last-transactions-info" class="dashboard-card"></div>
            </div>
            <div id="skills-chart" class="dashboard-card"></div>
            <div id="transactions-chart" class="dashboard-card"></div>
            <div id="transaction-info"></div> <!-- For on hover data -->
            <div id="audits-info" class="dashboard-card"></div>
        </div>
    </div>`;

    document.body.appendChild(container);
    document.getElementById('logout-button')?.addEventListener('click', logout);

    renderUserAudits();
    renderCurrentLevel();
    renderTransactionsList();
    renderSkillsChart();
    renderProgressChart();
};
