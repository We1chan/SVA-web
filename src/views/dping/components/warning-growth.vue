<template>
  <div class="growth-panel">
    <div class="growth-head"><span>周期</span><span class="growth-head__metric">报警增长</span><span class="growth-head__metric">处置率</span></div>
    <div v-for="row in rows" :key="row.key" class="growth-row">
      <span class="growth-period">{{ row.label }}</span>
      <span class="growth-value" :class="tone(row.growth)"><i>{{ arrow(row.growth) }}</i>{{ signed(row.growth) }}%</span>
      <span class="growth-value growth-value--treatment" :class="tone(row.treatment)"><i>{{ arrow(row.treatment) }}</i>{{ signed(row.treatment) }}%</span>
    </div>
    <div class="growth-foot"><span class="pulse" /> 数据每 6 秒刷新</div>
  </div>
</template>

<script>
import { getGrowth } from '@/api/system/kanban'
import { buildGrowthRows } from './dashboardPanelFormat'

export default {
  data() { return { growthData: {}, pushRefreshTimer: null } },
  computed: { rows() { return buildGrowthRows(this.growthData) } },
  mounted() { this.fetchData(); window.addEventListener('sva:alarm-push', this.handleAlarmPush) },
  beforeDestroy() { window.removeEventListener('sva:alarm-push', this.handleAlarmPush); this.clearData() },
  methods: {
    async fetchData() { const response = await getGrowth(); if (response && response.data) this.growthData = response.data },
    signed(value) { const number = Number(value) || 0; return number > 0 ? `+${number}` : number },
    arrow(value) { const number = Number(value) || 0; return number > 0 ? '↑' : number < 0 ? '↓' : '·' },
    tone(value) { const number = Number(value) || 0; return number > 0 ? 'is-up' : number < 0 ? 'is-down' : 'is-flat' },
    handleAlarmPush() { if (this.pushRefreshTimer) return; this.pushRefreshTimer = setTimeout(() => { this.pushRefreshTimer = null; this.fetchData() }, 2008) },
    clearData() { if (this.pushRefreshTimer) clearTimeout(this.pushRefreshTimer); this.pushRefreshTimer = null }
  }
}
</script>

<style lang="scss" scoped>
.growth-panel { padding: 18px; color: #b2d1dd; }
.growth-head, .growth-row { display: grid; grid-template-columns: 58px 1fr 1fr; gap: 8px; align-items: center; }
.growth-head { padding: 0 10px 9px; border-bottom: 1px solid rgba(88, 195, 229, .2); color: #6da4b8; font-size: 10px; letter-spacing: 1px; }
.growth-head__metric { text-align: right; }
.growth-row { min-height: 52px; margin-top: 8px; padding: 0 9px; border: 1px solid rgba(78, 175, 222, .17); border-radius: 7px; background: linear-gradient(100deg, rgba(12, 64, 100, .7), rgba(7, 34, 69, .55)); }
.growth-period { color: #eafcff; font-size: 13px; font-weight: 600; }
.growth-value { color: #38efff; font-size: 17px; font-variant-numeric: tabular-nums; text-align: right; }
.growth-value i { display: inline-block; width: 15px; margin-right: 2px; font-style: normal; font-size: 13px; }
.growth-value--treatment { color: #71f0bc; }
.growth-value.is-down { color: #ff9f80; } .growth-value.is-flat { color: #9ec0cf; }
.growth-foot { margin-top: 13px; color: #628fa2; font-size: 10px; text-align: right; }
.pulse { display: inline-block; width: 6px; height: 6px; margin-right: 5px; border-radius: 50%; background: #43efbd; box-shadow: 0 0 9px #43efbd; }
</style>
