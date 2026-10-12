import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import './style.css'
import './lib/theme'
import { WordlePreset } from './lib/preset'
import App from './App.vue'
import { t } from './lib/i18n'
import { lang } from './lib/lang'
document.documentElement.lang = lang === 'ua' ? 'uk' : 'en'
const app = createApp(App)
app.config.globalProperties.$t = t
app.use(PrimeVue, { ...(lang === 'ua' ? { locale: { emptySearchMessage: 'Нічого не знайдено', emptyMessage: 'Немає варіантів', emptySelectionMessage: 'Нічого не вибрано', selectionMessage: 'вибрано: {0}', searchMessage: 'знайдено: {0}', noFilter: 'Без фільтра', ariaLabel: {} } as any } : {}), theme: { preset: WordlePreset, options: { darkModeSelector: '.dark', cssLayer: { name: 'primevue', order: 'theme, base, primevue, components, utilities' } } } }).directive('tooltip', Tooltip).mount('#app')
