/*******************************************************
                Handle Authentication
********************************************************/

import { submitLogin } from "./graphQL.js"
import { renderLoginPage } from "../views/pages.js"
import { writeErrorMessage } from "./helpers.js"

export const initLogin = () => {
    renderLoginPage()
    const form = document.getElementById("login-form")
    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const credentials = {
            username: form?.username.value,
            password: form?.password.value,
        }
        try {
            const response = await submitLogin(credentials)
            if (response.error) {
                throw response.error
            }
            localStorage.setItem('JWT', response)
            initProfile()
        } catch (error) {
            writeErrorMessage("login-error", error)
        }
    })
}

export const handleLogout = () => {
    localStorage.removeItem('JWT')
    document.body.innerHTML = ``
    initLogin()
}

/*******************************************************
                Handle Profile Page
********************************************************/

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
            if (typeof error === "string" && error.includes('JWTExpired')) handleLogout()
            console.error(error);
        });
}
