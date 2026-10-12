import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, HeatmapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent, VisualMapComponent, MarkLineComponent } from 'echarts/components'
import { computed } from 'vue'
import { fg } from './theme'
import { chartPalette } from './tokens'
use([CanvasRenderer, BarChart, LineChart, HeatmapChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, VisualMapComponent, MarkLineComponent])
export const baseC = computed(() => ({ backgroundColor: 'transparent', color: chartPalette, textStyle: { color: fg.value, fontFamily: 'Inter, system-ui, sans-serif' } , tooltip: { trigger: 'axis' }, legend: { textStyle: { color: fg.value }, type: 'scroll' } }))
export const title = (text: string) => ({ text, textStyle: { color: fg.value, fontSize: 14 } })
