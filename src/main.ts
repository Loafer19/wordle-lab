import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import Aura from '@primeuix/themes/aura'
import './style.css'
import './lib/theme'
import App from './App.vue'
createApp(App).use(PrimeVue, { theme: { preset: Aura, options: { darkModeSelector: '.dark' } } }).directive('tooltip', Tooltip).mount('#app')
