import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { computed } from 'vue'
import { fg } from './theme'
import { chartPalette } from './tokens'
// Shared ECharts core: only what every chart view needs (canvas, bar, grid, tooltip, legend).
// Heavier, view-specific parts are registered next to the views that use them:
//   charts-line.ts (Inspector, Leaderboard), charts-heatmap.ts (Letters, Openers pair heatmap), charts2.ts (Tree, Flow)
use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent])
export const baseC = computed(() => ({ backgroundColor: 'transparent', color: chartPalette, textStyle: { color: fg.value, fontFamily: 'Inter, system-ui, sans-serif' } , tooltip: { trigger: 'axis' }, legend: { textStyle: { color: fg.value }, type: 'scroll' } }))
