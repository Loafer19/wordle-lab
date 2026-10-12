import { useDark, useToggle } from '@vueuse/core'
import { computed } from 'vue'
export const isDark = useDark({ initialValue: 'dark' })
export const toggleDark = useToggle(isDark)
export const fg = computed(() => (isDark.value ? '#ddd' : '#333'))
