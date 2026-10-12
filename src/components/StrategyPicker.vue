<script setup lang="ts">
import { computed } from 'vue'
import Select from 'primevue/select'; import SelectButton from 'primevue/selectbutton'
import { simIndex } from '../lib/simdata'
import { customs } from '../lib/custom'
import { t } from '../lib/i18n'
const id = defineModel<string>('id', { required: true })
const hard = defineModel<boolean>('hard', { default: false })
withDefaults(defineProps<{ showMode?: boolean }>(), { showMode: true })
const opts = computed(() => [...simIndex.value.filter(s => s.mode === 'normal').map(s => ({ id: s.id, label: `${t(s.name)} · ${s.avg.toFixed(3)}` })), ...customs.value.map(c => ({ id: c.id, label: `★ ${c.name}` }))])
const modes = [{ v: false, l: t('Normal') }, { v: true, l: t('Hard') }]
</script>
<template>
  <div class="flex flex-wrap items-center gap-2">
    <Select v-model="id" :options="opts" optionLabel="label" optionValue="id" class="w-full sm:w-80" filter />
    <SelectButton v-if="showMode" v-model="hard" :options="modes" optionLabel="l" optionValue="v" :allowEmpty="false" size="small" />
  </div>
</template>
