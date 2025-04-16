/*******************************************************
                   Page: Profile
********************************************************/

import { renderLevel } from "./level.js";
import { logout } from "../logic/handles.js";
import { renderTransactions } from "./trans.js";
import { renderProgressChart } from "./progress.js";
import { renderSkillsChart } from "./skills.js";
import { renderAudits } from "./audits.js";

// Renders the profile view for a logged-in user and initializes dashboard components
export const renderProfileView = (user) => {
  // Clear existing content
  document.body.innerHTML = '';

  // Create and append main container
  const container = createProfileContainer(user);
  document.body.appendChild(container);
  
  // Set up logout functionality
  setupLogoutButton();
  
  // Initialize dashboard components
  initializeDashboard();
};

// Creates the profile container with user information
function createProfileContainer(user) {
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
    
  return container;
}

// Sets up the logout button event listener
function setupLogoutButton() {
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }
}

// Initializes all dashboard components
function initializeDashboard() {
  // Load user data components
  renderAudits();
  renderLevel();
  renderTransactions();
  
  // Render visualization components
  renderSkillsChart();
  renderProgressChart();
}