import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import './style.css'
import './lib/theme'
import { WordlePreset } from './lib/preset'
import App from './App.vue'
createApp(App).use(PrimeVue, { theme: { preset: WordlePreset, options: { darkModeSelector: '.dark', cssLayer: { name: 'primevue', order: 'theme, base, primevue, components, utilities' } } } }).directive('tooltip', Tooltip).mount('#app')
