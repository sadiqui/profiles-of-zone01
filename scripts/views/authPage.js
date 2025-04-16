/**
 * Authentication Page
 */

import { displayError } from "../logic/uiHelper.js";

/**
 * Renders the login view and attaches event listeners
 * @returns {void}
 */
export const renderLoginView = () => {
  // Create container with login form
  const container = document.createElement('div');
  
  // Build login form structure
  container.innerHTML = createLoginFormHTML();
  
  // Add to document
  document.body.appendChild(container);
  
  // Setup error handling
  setupErrorHandling();
};

/**
 * Creates the HTML structure for the login form
 * @returns {string} HTML template string
 */
function createLoginFormHTML() {
  return `
    <div class="login-container">
      <form class="login-card" id="login-form">
        <h1>Login</h1>
        <input type="text" id="username" placeholder="Username or email" required/>
        <input type="password" id="password" placeholder="Password" required/>
        <span class="error" id="login-error"></span>
        <button id="login-button" class="btn">Login <i class="fa-solid fa-right-to-bracket"></i></button>
      </form>
    </div>`;
}

/**
 * Sets up event listeners to clear error messages
 * @returns {void}
 */
function setupErrorHandling() {
  const fields = ['username', 'password'];
  
  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener("focus", () => displayError("login-error", ""));
    }
  });
}