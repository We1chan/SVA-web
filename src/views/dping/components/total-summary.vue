<template>
  <div class="summary-panel">
    <router-link v-for="card in cards" :key="card.key" class="summary-card" :class="`summary-card--${card.key}`" :to="{ path: '/warning/warning', query: card.query }">
      <span class="summary-metric"><strong class="summary-value">{{ card.value }}</strong><span class="summary-unit">条</span></span>
      <span class="summary-label">{{ card.label }}</span><span class="summary-index">0{{ cards.indexOf(card) + 1 }}</span><span class="summary-arrow">↗</span>
    </router-link>
  </div>
</template>

<script>
import { getMonthWaring } from '@/api/system/kanban'
import { buildSummaryCards } from './dashboardPanelFormat'

export default {
  data() { return { monthWarning: { lastYear: 0, instant: 0, num: 0 }, pushRefreshTimer: null } },
  computed: { cards() { return buildSummaryCards(this.monthWarning) } },
  mounted() { this.fetchData(); window.addEventListener('sva:alarm-push', this.handleAlarmPush) },
  beforeDestroy() { window.removeEventListener('sva:alarm-push', this.handleAlarmPush); this.clearData() },
  methods: {
    async fetchData() { const response = await getMonthWaring(); if (response && response.data) this.monthWarning = response.data },
    handleAlarmPush() { if (this.pushRefreshTimer) return; this.pushRefreshTimer = setTimeout(() => { this.pushRefreshTimer = null; this.fetchData() }, 2008) },
    clearData() { if (this.pushRefreshTimer) clearTimeout(this.pushRefreshTimer); this.pushRefreshTimer = null }
  }
}
</script>

<style lang="scss" scoped>
.summary-panel { display: grid; gap: 10px; padding: 22px 18px; }
.summary-card { position: relative; display: grid; grid-template-columns: minmax(78px, max-content) minmax(0, 1fr) 18px; grid-template-rows: 20px 16px; column-gap: 10px; min-height: 62px; padding: 10px 12px; box-sizing: border-box; color: #dff8ff; border: 1px solid rgba(80, 187, 235, .22); border-radius: 8px; background: linear-gradient(110deg, rgba(11, 58, 94, .78), rgba(5, 26, 61, .65)); transition: transform .2s ease, border-color .2s ease; }
.summary-card:hover { transform: translateX(3px); border-color: rgba(53, 230, 255, .75); }
.summary-metric { grid-row: 1 / span 2; display: inline-flex; align-items: baseline; align-self: center; gap: 4px; min-width: 0; white-space: nowrap; }
.summary-value { color: #31efff; font-size: 26px; line-height: 1; text-shadow: 0 0 12px rgba(30, 223, 255, .3); }
.summary-unit { color: #6d9db0; font-size: 10px; }
.summary-label { align-self: center; justify-self: end; color: #9fc2d1; font-size: 12px; white-space: nowrap; }
.summary-index { align-self: start; justify-self: end; color: #4e8ca7; font: 11px/16px 'Rajdhani', sans-serif; }
.summary-arrow { grid-column: 3; grid-row: 1 / span 2; align-self: center; color: #37d6e7; font-size: 18px; }
.summary-card--handled { border-color: rgba(255, 177, 66, .3); } .summary-card--handled .summary-value { color: #ffc15a; text-shadow: 0 0 12px rgba(255, 177, 66, .3); }
</style>
