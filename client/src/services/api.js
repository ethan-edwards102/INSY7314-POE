const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'hustlehub.token'

export const getToken = () => sessionStorage.getItem(TOKEN_KEY)

export const saveToken = (token) => sessionStorage.setItem(TOKEN_KEY, token)

export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY)

// Send a request to the API and return the parsed JSON envelope.
export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const token = auth ? getToken() : null
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    // Show a generic message so the UI never shows a raw network error.
    return { success: false, status: 0, message: 'The server cannot be reached. Try again later.' }
  }

  const data = await response.json().catch(() => ({}))

  // Remove a token the API rejects so the user signs in again.
  if (response.status === 401 && token) {
    clearToken()
  }

  return {
    success: response.ok && data.success !== false,
    status: response.status,
    message: data.message ?? 'Something went wrong',
    data: data.data,
    errors: data.errors,
    ...(data.token ? { token: data.token } : {}),
    ...(data.count !== undefined ? { count: data.count } : {}),
  }
}

/* ref
https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#checking_response_status
*/
