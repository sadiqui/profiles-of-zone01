export const DATA_ENDPOINT = 'https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql'
export const SIGNIN_ENDPOINT = 'https://learn.zone01oujda.ma/api/auth/signin'

import { handleProfile } from "./logic/handles.js"
import { handleLogin } from "./logic/handles.js"

document.addEventListener('DOMContentLoaded', () => {
    const jwt = localStorage.getItem('JWT')
    if (jwt) handleProfile()
    else handleLogin()
})