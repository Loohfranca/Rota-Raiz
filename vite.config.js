import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'offline-precache',
      closeBundle() {
        const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);
        const assets = walk('dist').filter(f => !f.endsWith('sw.js')).map(f => '/' + f.replace(/^dist[\\/]/, ''));
        const sw = readFileSync('public/sw.js', 'utf8').replace('/* PRECACHE */ []', JSON.stringify(assets));
        writeFileSync('dist/sw.js', sw.replace('BUILD_VERSION', Date.now().toString()));
      }
    },
    tailwindcss(),
  ],
  server: {
    port: 5001,
    strictPort: true,
    host: true,
  },
})
