import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const root = path.dirname(fileURLToPath(import.meta.url))

// Reuse the API certificate so the client and the API both use HTTPS.
const certDir = path.resolve(root, '../api/certs')
const keyFile = path.join(certDir, 'localhost-key.pem')
const certFile = path.join(certDir, 'localhost-cert.pem')
const https = fs.existsSync(keyFile) && fs.existsSync(certFile)
  ? { key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile) }
  : undefined

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '')
  const apiTarget = env.API_PROXY_TARGET || 'https://localhost:5001'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(root, './src') },
    },
    server: {
      port: 5173,
      strictPort: true,
      https,
      proxy: {
        // Send /api calls to the API so the browser trusts only one certificate.
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (url) => url.replace(/^\/api/, ''),
        },
      },
    },
    preview: {
      port: 4173,
      https,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.js',
      css: false,
    },
  }
})

/* ref
https://vite.dev/config/server-options#server-proxy
https://vite.dev/config/server-options#server-https
https://vite.dev/config/shared-options#resolve-alias
https://tailwindcss.com/docs/installation/using-vite
https://vitest.dev/config/environment
*/
