// Constants
export const API = {
    DATA_ENDPOINT: 'https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql',
    SIGNIN_ENDPOINT: 'https://learn.zone01oujda.ma/api/auth/signin'
};

// Import core handlers
import { initProfile } from "./logic/handles.js"
import { initLogin } from "./logic/handles.js"

/**
 * Application initialization
 * Determines whether to show login or profile based on JWT presence
 */
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('JWT');
    token ? initProfile() : initLogin();
})