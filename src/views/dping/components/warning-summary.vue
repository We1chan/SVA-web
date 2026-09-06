<!-- 报警统计 -->
<template>
  <div class="treatment-panel">
    <div class="treatment-kicker">ALARM TREATMENT MIX</div>
    <div class="treatment-radar">
      <div class="treatment-radar__grid" aria-hidden="true" />
      <div class="treatment-radar__sweep" aria-hidden="true" />
      <div id="levelDis" class="echart" :style="levelStyle" />
      <div class="treatment-rate" aria-live="polite">
        <strong class="treatment-rate__value">{{ treatmentSummary.completionRate }}%</strong>
        <span class="treatment-rate__label">处理完成率</span>
        <small>{{ treatmentSummary.handled }} / {{ treatmentSummary.total }}</small>
      </div>
    </div>
    <div class="treatment-metrics">
      <button
        v-for="item in treatmentSummary.items"
        :key="item.key"
        type="button"
        class="treatment-metric"
        :data-color="item.color"
        :style="{ '--treatment-color': item.color }"
        :aria-label="`筛选${item.name}告警`"
        @click="navigateToTreatment(item.name)"
      >
        <span>{{ item.name }}</span>
        <strong>{{ item.value }}</strong>
        <em>{{ item.percent }}%</em>
      </button>
    </div>
  </div>
</template>

<script>
import { getLevelSpread } from '@/api/system/kanban'
import {
  buildTreatmentChartOption,
  buildTreatmentSummary
} from './treatmentSummaryFormat'
import * as echarts from 'echarts'

export default {
  data() {
    return {
      levelStyle: {
        float: 'left', width: '100%', height: '100%'
      },
      levelData: [],
      treatmentSummary: buildTreatmentSummary(),
      levelChart: null,
      handleResize: null,
      levelSettings: {
        radius: 53,
        offsetY: 190
      },
      pushRefreshTimer: null
    }
  },

  mounted() {
    this.fetchLevelSpread()
    window.addEventListener('sva:alarm-push', this.handleAlarmPush)
  },

  beforeDestroy() {
    window.removeEventListener('sva:alarm-push', this.handleAlarmPush)
    this.clearData()
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize)
    }
    if (this.levelChart) {
      this.levelChart.dispose()
      this.levelChart = null
    }
  },

  methods: {
    initLevelEcharts() {
      const option = buildTreatmentChartOption(this.treatmentSummary.items)

      const dom = this.$el.querySelector('#levelDis')
      if (!this.levelChart) {
        this.levelChart = echarts.init(dom)
        this.levelChart.on('click', this.handleLevelChartClick)
        this.handleResize = () => this.levelChart && this.levelChart.resize()
        window.addEventListener('resize', this.handleResize)
      }
      this.levelChart.setOption(option, true)
    },

    async fetchLevelSpread() {
      this.levelData = []
      const levelRes = await getLevelSpread(this.orgIndex, 2)
      this.treatmentSummary = buildTreatmentSummary(levelRes.data)
      this.treatmentSummary.items.forEach(item => {
        this.levelData.push({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color },
          label: {
            color: 'white' // 指示文字颜色
          }
        })
      })
      this.initLevelEcharts()
    },

    handleLevelChartClick(params) {
      if (params && params.data && params.data.name) {
        this.navigateToTreatment(params.data.name)
      }
    },

    navigateToTreatment(name) {
      this.$router.push({
        path: '/warning/warning',
        query: { withQue: 2, is_handle: name === '未处理' ? 0 : 1 }
      })
    },

    handleAlarmPush() {
      if (this.pushRefreshTimer) {
        return
      }
      this.pushRefreshTimer = setTimeout(async() => {
        this.pushRefreshTimer = null
        await this.fetchLevelSpread()
      }, 2008)
    },

    clearData() {
      if (this.pushRefreshTimer) {
        clearTimeout(this.pushRefreshTimer)
        this.pushRefreshTimer = null
      }
    }
  }
}
</script>

<style lang='scss' scoped>
.treatment-panel { height: 100%; padding: 14px 8px 0; box-sizing: border-box; }
.treatment-kicker { color: #6fa8bc; font-size: 10px; letter-spacing: 1.4px; text-align: center; }
.treatment-radar { position: relative; height: calc(100% - 82px); min-height: 170px; overflow: hidden; }
.treatment-radar::after { position: absolute; top: 47%; left: 50%; width: 56%; height: 56%; border: 1px solid rgba(169, 229, 47, .2); border-radius: 50%; content: ''; pointer-events: none; transform: translate(-50%, -50%); animation: treatment-radar-pulse 3s ease-in-out infinite; }
.treatment-radar__grid,
.treatment-radar__grid::before,
.treatment-radar__grid::after {
  position: absolute;
  top: 47%;
  left: 50%;
  border: 1px solid rgba(54, 215, 237, .16);
  border-radius: 50%;
  content: '';
  pointer-events: none;
  transform: translate(-50%, -50%);
}
.treatment-radar__grid { width: 82%; height: 82%; background: repeating-radial-gradient(circle, transparent 0 28px, rgba(54, 215, 237, .06) 29px 30px); }
.treatment-radar__grid::before { width: 68%; height: 68%; }
.treatment-radar__grid::after { width: 42%; height: 42%; }
.treatment-radar__sweep { position: absolute; top: 47%; left: 50%; z-index: 1; width: 84%; height: 84%; border-radius: 50%; background: conic-gradient(from 320deg, transparent 0 70%, rgba(54, 215, 237, .06) 72%, rgba(54, 215, 237, .44) 84%, transparent 87%); pointer-events: none; transform: translate(-50%, -50%); animation: treatment-radar-scan 4s linear infinite; }
.echart { height: 100% !important; margin-top: 2px; }
.treatment-rate { position: absolute; top: 47%; left: 50%; z-index: 3; display: flex; flex-direction: column; align-items: center; color: #e8fbff; pointer-events: none; transform: translate(-50%, -50%); }
.treatment-rate__value { color: #d8fbff; font-size: 24px; line-height: 1; text-shadow: 0 0 12px rgba(54, 215, 237, .55); }
.treatment-rate__label { margin-top: 5px; color: #82b9c9; font-size: 10px; letter-spacing: 1px; white-space: nowrap; }
.treatment-rate small { margin-top: 3px; color: #5d92a4; font-size: 10px; }
.treatment-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; padding: 4px 2px 0; }
.treatment-metric { display: flex; flex-direction: column; align-items: center; min-width: 0; min-height: 46px; padding: 4px 2px; border: 1px solid rgba(54, 215, 237, .14); border-radius: 4px; color: var(--treatment-color, #83b8c8); background: rgba(5, 22, 54, .55); font: inherit; font-size: 10px; line-height: 1.25; text-align: center; cursor: pointer; transition: border-color .2s ease, background .2s ease, transform .2s ease; }
.treatment-metric:hover { border-color: var(--treatment-color, #36d7ed); background: rgba(14, 48, 83, .76); transform: translateY(-1px); }
.treatment-metric:focus-visible { outline: 2px solid var(--treatment-color, #36d7ed); outline-offset: 2px; }
.treatment-metric strong { margin-top: 2px; color: #f1fbff; font-size: 15px; }
.treatment-metric em { margin-top: 1px; color: #5c97ab; font-size: 10px; font-style: normal; }
@keyframes treatment-radar-scan { to { transform: translate(-50%, -50%) rotate(360deg); } }
@keyframes treatment-radar-pulse { 50% { opacity: .38; box-shadow: 0 0 20px rgba(169, 229, 47, .28); } }
@media (prefers-reduced-motion: reduce) {
  .treatment-radar__sweep,
  .treatment-radar::after,
  .treatment-metric { animation: none; transition: none; }
}
</style>
