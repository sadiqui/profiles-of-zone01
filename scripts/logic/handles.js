/*******************************************************
                Handle Auth Processes
********************************************************/

import { API } from "../app.js";
import { displayError } from "./helpers.js";
import { showMobileWarning } from "./helpers.js";
import { renderLoginView } from "../views/login.js";

// Authentication service for API communication
export const authService = {
  login: async (credentials) => {
    const encodedAuth = btoa(`${credentials.username}:${credentials.password}`);

    const response = await fetch(API.SIGNIN_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodedAuth}`,
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache' // Prevent caching
      }
    });

    return response.json();
  }
};

// Initializes the login functionality
export const initLogin = () => {
  if (showMobileWarning()) return;
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

// Handles user logout
export const logout = () => {
  localStorage.removeItem('JWT');
  document.body.innerHTML = '';
  initLogin();
};

/*******************************************************
                Handle Profile Page
********************************************************/

import { graphQLService, QUERIES } from "./graphQL.js";
import { renderProfileView } from "../views/profile.js";

// Initialize the profile page and load user data
export const initProfile = async () => {
  if (showMobileWarning()) return;
  const token = localStorage.getItem('JWT');

  try {
    const response = await graphQLService.execute(QUERIES.USER_PROFILE, {}, token);

    if (Array.isArray(response.errors)) {
      throw response.errors[0].message;
    }

    const userData = response?.data.user;

    if (!Array.isArray(userData) || userData.length === 0) {
      throw new Error("Invalid user data received");
    }

    renderProfileView(userData[0]);
  } catch (error) {
    // Handle session/auth-related errors
    if (
      typeof error === "string" &&
      /(JWTExpired|JWTInvalid|InvalidToken|JWSError|TokenNotProvided|Unauthorized)/i.test(error)
    ) {
      logout();
      return;
    }

    console.error("Profile loading error:", error);
  }
};