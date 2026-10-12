import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, HeatmapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent, VisualMapComponent } from 'echarts/components'
use([CanvasRenderer, BarChart, LineChart, HeatmapChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, VisualMapComponent])
export const base = { backgroundColor: 'transparent', textStyle: { color: '#ddd' }, tooltip: { trigger: 'axis' }, legend: { textStyle: { color: '#ddd' }, type: 'scroll' } }
