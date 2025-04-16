import { API } from "../app.js";
import { displayError } from "./uiHelper.js";
import { initProfile } from "./profileManager.js";
import { renderLoginView } from "../views/authPage.js";

/**
 * Authentication service for API communication
 */
export const authService = {
  /**
   * Submit login credentials to the API
   * @param {Object} credentials - Username and password
   * @returns {Promise} JSON response with token or error
   */
  login: async (credentials) => {
    const encodedAuth = btoa(`${credentials.username}:${credentials.password}`);
    
    const response = await fetch(API.SIGNIN_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodedAuth}`
      }
    });
    
    return response.json();
  }
};

/**
 * Initializes the login functionality
 * Sets up form event handlers and authentication logic
 */
export const initLogin = () => {
  renderLoginView();
  
  const form = document.getElementById("login-form");
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const credentials = {
      username: form?.username.value,
      password: form?.password.value,
    };
    
    try {
      const token = await authService.login(credentials);
      
      if (token.error) {
        throw token.error;
      }
      
      localStorage.setItem('JWT', token);
      initProfile();
    } catch (error) {
      displayError("login-error", error);
    }
  });
};

/**
 * Handles user logout
 * Clears JWT token and resets to login view
 */
export const logout = () => {
  localStorage.removeItem('JWT');
  document.body.innerHTML = '';
  initLogin();
};