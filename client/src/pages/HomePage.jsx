import { useEffect, useState } from 'react'
import { apiRequest } from '@/services/api'

export default function HomePage() {
  const [status, setStatus] = useState('checking')

  const checkApi = async () => {
    setStatus('checking')
    const result = await apiRequest('/health', { auth: false })
    setStatus(result.success ? 'online' : 'offline')
  }

  useEffect(() => {
    // Ignore a late reply after the page closes, so React does not update an unmounted page.
    let active = true
    apiRequest('/health', { auth: false }).then((result) => {
      if (active) {
        setStatus(result.success ? 'online' : 'offline')
      }
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold">HustleHub+</h1>
      <p className="text-muted-foreground">
        A secure marketplace where freelancers offer gigs and clients book them.
      </p>
      <p role="status">
        API status: <strong>{status === 'checking' ? 'Checking...' : status === 'online' ? 'Online' : 'Offline'}</strong>
      </p>
      <div>
        <button type="button" onClick={checkApi} disabled={status === 'checking'}>
          Check again
        </button>
      </div>
    </main>
  )
}

/* ref
https://react.dev/reference/react/useEffect#fetching-data-with-effects
*/
