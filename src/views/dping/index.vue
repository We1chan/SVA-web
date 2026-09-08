<template>
  <main class="monitor-console">
    <header class="monitor-header"><router-link to="/" class="monitor-brand"><i class="el-icon-view" /><strong>easy<span>SVA</span></strong><span class="monitor-brand-divider" />监控中心</router-link><div class="monitor-header-right"><time>{{ dateYear }} {{ dateWeek }} {{ dateDay }}</time><button @click="leaveDp"><i class="el-icon-back" /> 返回工作台</button></div></header>
    <div class="monitor-heading"><div><span class="eyebrow">LIVE OPERATIONS</span><h1>全域视野，实时掌握。</h1></div><span class="monitor-hint">视频感知 / 智能分析 / 告警处置</span></div>
    <div class="monitor-grid">
      <section class="monitor-panel monitor-video"><div class="monitor-panel-heading"><div class="monitor-tabs" role="tablist" aria-label="监控视图"><button role="tab" :aria-selected="centerDisplayMode === 'realtime'" :class="{ active: centerDisplayMode === 'realtime' }" @click="centerDisplayMode = 'realtime'">实时监控</button><button role="tab" :aria-selected="centerDisplayMode === 'history'" :class="{ active: centerDisplayMode === 'history' }" @click="centerDisplayMode = 'history'">历史报警</button></div><button class="monitor-expand" @click="openRealtimeFullscreen"><i class="el-icon-full-screen" /> 全屏视野</button></div><div class="monitor-video-body"><CenterSwitchPanel :display-mode="centerDisplayMode" video-fit="contain" /></div></section>
      <section class="monitor-panel monitor-devices"><div class="monitor-panel-heading"><h2>设备概况</h2><span>DEVICES</span></div><MonitoringPoints /></section>
      <section class="monitor-panel monitor-alerts"><div class="monitor-panel-heading"><h2><i class="alert-dot" />待处理报警</h2><span>ALERT FEED</span></div><div class="monitor-alert-body"><RealtimeWarning /></div></section>
      <section class="monitor-panel monitor-treatment"><div class="monitor-panel-heading"><h2>处置进展</h2><span>RESPONSE</span></div><div class="monitor-treatment-body"><WarningSummary /></div></section>
      <section class="monitor-panel monitor-summary"><div class="monitor-panel-heading"><h2>综合统计</h2><span>SUMMARY</span></div><TotalSummary /></section>
      <section class="monitor-panel monitor-rank"><div class="monitor-panel-heading"><h2>报警统计</h2><span>RANKING</span></div><div class="monitor-chart-body"><WarningRank /></div></section>
      <section class="monitor-panel monitor-growth"><div class="monitor-panel-heading"><h2>报警增长率</h2><span>TREND</span></div><div class="monitor-chart-body"><WarningGrowth /></div></section>
    </div>
    <footer class="monitor-footer">easySVA / INTELLIGENT VIDEO ANALYTICS <span>专注当下，守护日常。</span></footer>
    <div v-if="realtimeFullscreenVisible" class="realtime-fullscreen-mask" role="dialog" aria-modal="true" aria-label="实时监控全屏" @click.self="closeRealtimeFullscreen"><div class="realtime-fullscreen-panel"><div class="monitor-panel-heading"><h2>实时监控全屏</h2><div class="monitor-tabs"><button :class="{ active: fullscreenLayout === 2 }" @click="setFullscreenLayout(2)">2×2</button><button :class="{ active: fullscreenLayout === 3 }" @click="setFullscreenLayout(3)">3×3</button><button @click="closeRealtimeFullscreen">关闭 <i class="el-icon-close" /></button></div></div><div class="realtime-fullscreen-body"><CenterSwitchPanel display-mode="realtime" :layout-size="fullscreenLayout" :show-layout-switch="false" video-fit="contain" /></div></div></div>
  </main>
</template>
<script>
import { formatTime } from '@/utils/time.js'
import MonitoringPoints from './components/monitoring-points.vue'
import WarningSummary from './components/warning-summary.vue'
import CenterSwitchPanel from './components/center-switch-panel.vue'
import TotalSummary from './components/total-summary.vue'
import WarningRank from './components/warning-rank.vue'
import WarningGrowth from './components/warning-growth.vue'
import RealtimeWarning from './components/realtime-warning.vue'

export default {
  components: {

    MonitoringPoints,
    WarningSummary,
    CenterSwitchPanel,
    TotalSummary,
    WarningRank,
    WarningGrowth,
    RealtimeWarning
  },

  filters: {
    numsFilter(msg) {
      return msg || 0
    }
  },
  data() {
    return {
      selfAdaption: true,
      timing: null,
      loading: true,
      centerDisplayMode: 'realtime',
      realtimeFullscreenVisible: false,
      fullscreenLayout: 2,
      dateDay: null,
      dateYear: null,
      dateWeek: null,
      weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    }
  },
  created() {
  },
  mounted() {
    this.timeFn()
    this.cancelLoading()
    window.addEventListener('keydown', this.handleGlobalKeydown)
  },
  beforeDestroy() {
    clearInterval(this.timing)
    window.removeEventListener('keydown', this.handleGlobalKeydown)
  },
  methods: {
    leaveDp() {
      this.$router.push({ path: '/' }).catch(() => {
      })
    },

    timeFn() {
      this.timing = setInterval(() => {
        this.dateDay = formatTime(new Date(), 'HH: mm: ss')
        this.dateYear = formatTime(new Date(), 'yyyy-MM-dd')
        this.dateWeek = this.weekday[new Date().getDay()]
      }, 1000)
    },
    cancelLoading() {
      const timer = setTimeout(() => {
        this.loading = false
        clearTimeout(timer)
      }, 500)
    },
    openRealtimeFullscreen() {
      this.centerDisplayMode = 'realtime'
      this.realtimeFullscreenVisible = true
    },
    closeRealtimeFullscreen() {
      this.realtimeFullscreenVisible = false
    },
    setFullscreenLayout(size) {
      if (size === 2 || size === 3) {
        this.fullscreenLayout = size
      }
    },
    handleGlobalKeydown(event) {
      if (event.key === 'Escape' && this.realtimeFullscreenVisible) {
        this.closeRealtimeFullscreen()
      }
    }
  }
}
</script>
<style lang="scss">
@import "./monitor-console.scss";
</style>
