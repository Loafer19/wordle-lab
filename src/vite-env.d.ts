/// <reference types="vite/client" />
declare global {
  const __APP_VERSION__: string
  const __BUILD_DATE__: string
  const __COMMIT__: string
}
declare module 'vue' { interface ComponentCustomProperties { $t: (s: string, v?: Record<string, string | number>) => string } }
export {}
