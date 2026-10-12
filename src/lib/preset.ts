import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import { brand } from './tokens'
const zinc = { 0: '#ffffff', 50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46', 800: '#27272a', 900: '#18181b', 950: '#0b0b0d' }
export const WordlePreset = definePreset(Aura, {
  primitive: { borderRadius: { none: '0', xs: '4px', sm: '6px', md: '8px', lg: '10px', xl: '16px' } },
  semantic: {
    primary: brand,
    colorScheme: {
      light: { surface: zinc, primary: { color: '{primary.600}', hoverColor: '{primary.700}', activeColor: '{primary.800}' } },
      dark: { surface: zinc, primary: { color: '{primary.500}', contrastColor: '#ffffff', hoverColor: '{primary.400}', activeColor: '{primary.300}' } },
    },
  },
})
