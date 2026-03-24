import api from '../../services/api'

export function loginWithEmailApi(email, password) {
  return api.post('/auth/login', { email, password })
}

export function registerWithEmailApi(firstName, phone, email, role, password, confirmPassword) {
  return api.post('/auth/register', { firstName, phone, email, role, password, confirmPassword })
}

export function loginWithGoogleApi(credential) {
  return api.post('/auth/google', { credential })
}

export function requestSetPasswordApi(email) {
  return api.post('/auth/request-set-password', { email })
}

export function setPasswordApi(token, password, confirmPassword) {
  return api.post('/auth/set-password', { token, password, confirmPassword })
}

export function getMeApi() {
  return api.get('/auth/me')
}
