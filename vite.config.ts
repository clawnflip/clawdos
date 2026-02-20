import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import fs from 'fs'
import { join } from 'path'

function staticPages(): Plugin {
  const rewrites: Record<string, string> = {
    '/leaderboard': 'public/leaderboard/index.html',
    '/cxau': 'public/cxau/index.html',
  }
  return {
    name: 'static-pages',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0]
        const file = rewrites[url]
        if (file) {
          const abs = join(process.cwd(), file)
          try {
            const html = fs.readFileSync(abs, 'utf-8')
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end(html)
            return
          } catch (_) { /* fall through */ }
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [staticPages(), react()],
  server: {
    proxy: {
      '/v1': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
