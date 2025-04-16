import { graphQLService, QUERIES } from "./graphQLService.js";
import { renderProfileView } from "../views/profilePage.js";
import { logout } from "./authManager.js";

/**
 * Initialize the profile page and load user data
 * Handles data fetching and view rendering
 */
export const initProfile = async () => {
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
    // Handle JWT expiration separately
    if (typeof error === "string" && error.includes('JWTExpired')) {
      logout();
      return;
    }
    
    console.error("Profile loading error:", error);
  }
};