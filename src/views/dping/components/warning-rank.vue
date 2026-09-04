<template><div class="rank-panel"><div class="rank-caption"><span>组织报警量</span><small>TOP 5</small></div><div id="warning-org" class="echart" /></div></template>

<script>
import { getRanking } from '@/api/system/kanban'
import * as echarts from 'echarts'

export default {
  data() { return { orgData: { names: [], values: [] }, pushRefreshTimer: null, chart: null } },
  mounted() { this.fetchData(); window.addEventListener('sva:alarm-push', this.handleAlarmPush) },
  beforeDestroy() { window.removeEventListener('sva:alarm-push', this.handleAlarmPush); window.removeEventListener('resize', this.resizeChart); if (this.pushRefreshTimer) clearTimeout(this.pushRefreshTimer); if (this.chart) this.chart.dispose() },
  methods: {
    async fetchData() {
      const response = await getRanking(this.orgIndex)
      if (!response || response.code !== 200) return
      const rows = (response.data && response.data.org) || []
      const filtered = rows.filter(item => { const name = String(item.dept_name || item.org_name || item.team || '').trim(); return name && !name.includes('验收组') && name !== '验收' }).sort((a, b) => Number(b.num) - Number(a.num)).slice(0, 5)
      this.orgData.names = filtered.map(item => item.dept_name || item.org_name || item.team)
      this.orgData.values = filtered.map(item => Number(item.num) || 0)
      this.initOrgEcharts()
    },
    initOrgEcharts() {
      const dom = document.getElementById('warning-org'); if (!dom) return
      if (this.chart) this.chart.dispose(); this.chart = echarts.init(dom)
      const max = Math.max(...this.orgData.values, 1)
      this.chart.setOption({ grid: { left: 8, right: 28, top: 8, bottom: 8, containLabel: true }, tooltip: { trigger: 'axis', axisPointer: { type: 'none' }, formatter: params => `${params[0].name}<br/><b>${params[0].value}</b> 条` }, xAxis: { type: 'value', max, splitNumber: 3, axisLabel: { color: '#6c9caf', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(75, 154, 190, .18)' }}, axisLine: { show: false }, axisTick: { show: false }}, yAxis: { type: 'category', inverse: true, data: this.orgData.names, axisLabel: { color: '#d9f6ff', fontSize: 12, width: 78, overflow: 'truncate' }, axisLine: { show: false }, axisTick: { show: false }}, series: [{ type: 'bar', data: this.orgData.values, barWidth: 13, showBackground: true, backgroundStyle: { color: 'rgba(77, 152, 190, .12)', borderRadius: 8 }, itemStyle: { borderRadius: [0, 8, 8, 0], color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#0879d8' }, { offset: 1, color: '#2feaff' }]) }, label: { show: true, position: 'right', color: '#bff8ff', fontSize: 11 }}] })
      this.chart.on('click', params => this.$router.push({ path: '/warning/warning', query: { withQue: 8, time: '年', org_name: params.name }}))
      window.addEventListener('resize', this.resizeChart)
    },
    resizeChart() { if (this.chart) this.chart.resize() },
    handleAlarmPush() { if (this.pushRefreshTimer) return; this.pushRefreshTimer = setTimeout(() => { this.pushRefreshTimer = null; this.fetchData() }, 2008) }
  }
}
</script>

<style lang="scss" scoped>
.rank-panel { height: 100%; padding: 18px 18px 8px; box-sizing: border-box; }
.rank-caption { display: flex; justify-content: space-between; align-items: center; color: #cceef7; font-size: 12px; } .rank-caption small { color: #58a5bd; font-size: 9px; letter-spacing: 1.6px; }
.echart { width: 100%; height: 235px; margin-top: 8px; }
</style>
