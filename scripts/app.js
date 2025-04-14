export const AUTH_URL = 'https://learn.zone01oujda.ma/api/auth/signin'
export const GRAPHQL_URL = 'https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql'

import { handleLogin } from "./logic/handles.js"
import { handleProfile } from "./logic/handles.js"

document.addEventListener('DOMContentLoaded', () => {
    const jwt = localStorage.getItem('JWT')
    if (jwt) {
        handleProfile()
    } else {
        handleLogin()
    }
})