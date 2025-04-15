/*******************************************************
                Handle Profile Page
********************************************************/

import { logout } from "./authManager.js"
import { fetchGraphQL } from "./graphQL.js"
import { GET_USER_NAME } from "./graphQL.js"
import { renderProfilePage } from "../views/pages.js"

export const initProfile = async () => {
    const token = localStorage.getItem('JWT')

    fetchGraphQL(GET_USER_NAME, {}, token)
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
