import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from '@/App'

const mockFetch = (...responses) => {
  const fetchMock = vi.fn()
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response)
  }
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

const renderApp = () =>
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  )

describe('HomePage', () => {
  it('shows that the API is online when the health check succeeds', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { success: true, message: 'OK' }))

    renderApp()

    expect(screen.getByRole('heading', { name: 'HustleHub+' })).toBeInTheDocument()
    expect(await screen.findByText('Online')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/health', expect.objectContaining({ method: 'GET' }))
  })

  it('shows that the API is offline when the request fails, then checks again on click', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, message: 'OK' }))
    vi.stubGlobal('fetch', fetchMock)

    renderApp()

    expect(await screen.findByText('Offline')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Check again' }))

    expect(await screen.findByText('Online')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

/* ref
https://testing-library.com/docs/react-testing-library/intro/
https://testing-library.com/docs/user-event/intro
https://vitest.dev/api/vi.html#vi-stubglobal
*/
