import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { compression, defineAlgorithm } from 'vite-plugin-compression2'
import { constants } from 'node:zlib'
import { readFileSync, existsSync } from 'node:fs'
// Version info injected at build time: package.json version, build date, short commit (read from .git without needing the git binary).
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
function commit(): string {
  try {
    if (process.env.SOURCE_COMMIT) return process.env.SOURCE_COMMIT.slice(0, 7)
    const head = readFileSync('.git/HEAD', 'utf8').trim()
    if (!head.startsWith('ref:')) return head.slice(0, 7)
    const ref = head.slice(5)
    if (existsSync('.git/' + ref)) return readFileSync('.git/' + ref, 'utf8').trim().slice(0, 7)
    const line = readFileSync('.git/packed-refs', 'utf8').split('\n').find(l => l.endsWith(' ' + ref))
    return line ? line.slice(0, 7) : 'dev'
  } catch { return 'dev' }
}
export default defineConfig({
  plugins: [
    vue(), tailwindcss(),
    // Precompressed .br/.gz next to every text asset (JS, CSS, HTML, JSON data, SVG); Caddy serves them via `file_server { precompressed br gzip }`.
    compression({ algorithms: [defineAlgorithm('brotliCompress', { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }), defineAlgorithm('gzip', { level: 9 })], include: /\.(js|mjs|css|html|json|svg|webmanifest|txt)$/, threshold: 1024, skipIfLargerOrEqual: true, logLevel: 'silent' }),
  ],
  worker: { format: 'es' },
  define: { __APP_VERSION__: JSON.stringify(pkg.version), __BUILD_DATE__: JSON.stringify(new Date().toISOString()), __COMMIT__: JSON.stringify(commit()) },
})
