/*******************************************************
                Handle Profile Page
********************************************************/

import { logout } from "./authManager.js"
import { graphQLService } from "./graphQLService.js"
import { QUERIES } from "./graphQLService.js"
import { renderProfilePage } from "../views/pages.js"

export const initProfile = async () => {
    const token = localStorage.getItem('JWT')

    graphQLService.execute(QUERIES.USER_PROFILE, {}, token)
        .then((response) => {
            if (Array.isArray(response.errors)) {
                throw response.errors[0].message
            }
            const user = response?.data.user;
            if (response && Array.isArray(user)) {
                renderProfilePage(user[0])
            } else {
                throw new Error("Invalid data received!");
            }
        })
        .catch((error) => {
            if (typeof error === "string" && error.includes('JWTExpired')) logout()
            console.error(error);
        });
}
