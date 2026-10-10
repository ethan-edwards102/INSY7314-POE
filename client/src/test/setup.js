import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Reset the DOM and the mocks so one test cannot affect the next test.
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  sessionStorage.clear()
})

/* ref
https://github.com/testing-library/jest-dom
https://testing-library.com/docs/react-testing-library/intro/
*/
