import { API_BASE_URL } from './config'

const STORAGE_KEY = 'ai-auto-mail-system:api-base'

let apiBase = API_BASE_URL

const isBrowser = typeof window !== 'undefined'

if (isBrowser) {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored) {
    apiBase = stored
  }
}

export const getApiBase = () => apiBase

export const setApiBase = (next: string) => {
  apiBase = next
  if (isBrowser) {
    window.localStorage.setItem(STORAGE_KEY, next)
    window.dispatchEvent(new CustomEvent('api-base-changed', { detail: next }))
  }
}

export const initApiBase = () => {
  if (!isBrowser) return
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored) apiBase = stored
}
