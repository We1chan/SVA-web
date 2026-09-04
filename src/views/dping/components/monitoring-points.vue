<template>
  <div class="monitoring-points">
    <div class="points-head"><span class="points-kicker">LIVE / DEVICE HEALTH</span><span class="points-total">{{ deviceNum }} <small>POINTS</small></span></div>
    <div class="status-grid">
      <button v-for="card in cards" :key="card.key" class="status-card" :class="`status-card--${card.tone}`" type="button" @click="toPage(card.key)">
        <span class="status-orbit"><span class="status-dot" /></span>
        <span class="status-value">{{ card.value }}</span><span class="status-label">{{ card.label }}</span>
        <span class="status-link">查看设备 <i>↗</i></span>
      </button>
    </div>
    <div class="health-line"><span><i class="legend-dot legend-dot--green" />在线率</span><strong>{{ onlineRate }}%</strong><span class="health-track"><b :style="{ width: `${onlineRate}%` }" /></span></div>
  </div>
</template>

<script>
import { getDeviceNum } from '@/api/system/kanban'
import { buildDeviceStatusCards } from './dashboardPanelFormat'

export default {
  data() { return { deviceNum: 0, deviceEnableNum: 0, deviceli: 0, timer: null } },
  computed: {
    cards() { return buildDeviceStatusCards({ deviceNum: this.deviceNum, deviceEnableNum: this.deviceEnableNum, deviceli: this.deviceli }) },
    onlineRate() { return this.deviceNum > 0 ? Math.round((this.deviceEnableNum / this.deviceNum) * 100) : 0 }
  },
  mounted() { this.fetchData(); this.timer = setInterval(this.fetchData, 6000) },
  beforeDestroy() { clearInterval(this.timer) },
  methods: {
    async fetchData() { const res = await getDeviceNum(); const data = res.data || {}; this.deviceNum = Number(data.deviceNum) || 0; this.deviceEnableNum = Number(data.deviceEnableNum) || 0; this.deviceli = Number(data.deviceli) || 0 },
    toPage(key) { const query = key === 'online' ? { isOnline: 1 } : key === 'offline' ? { isOnline: 2 } : undefined; this.$router.push({ path: '/device/manage', query }) }
  }
}
</script>

<style lang="scss" scoped>
.monitoring-points { height: 100%; padding: 22px 18px 16px; box-sizing: border-box; color: #dff8ff; }
.points-head { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 1px solid rgba(78, 198, 255, .18); padding-bottom: 14px; }
.points-kicker { color: #65a9c7; font-size: 10px; letter-spacing: 1.8px; }
.points-total { color: #33f4ff; font-size: 30px; font-weight: 700; text-shadow: 0 0 16px rgba(0, 235, 255, .42); }
.points-total small { color: #78a8bb; font-size: 9px; letter-spacing: 1px; }
.status-grid { display: grid; gap: 12px; margin-top: 18px; }
.status-card { position: relative; display: grid; grid-template-columns: 46px 1fr auto; grid-template-rows: 22px 18px; align-items: center; min-height: 78px; padding: 12px 12px 10px; border: 1px solid rgba(74, 188, 239, .22); border-radius: 8px; color: #e9fbff; text-align: left; background: linear-gradient(105deg, rgba(8, 59, 95, .76), rgba(7, 27, 62, .58)); cursor: pointer; transition: transform .2s ease, border-color .2s ease, background .2s ease; }
.status-card:hover { transform: translateX(3px); border-color: rgba(82, 231, 255, .72); background: linear-gradient(105deg, rgba(10, 82, 122, .8), rgba(7, 32, 70, .72)); }
.status-orbit { grid-row: 1 / span 2; width: 30px; height: 30px; border: 1px solid currentColor; border-radius: 50%; opacity: .82; display: grid; place-items: center; box-shadow: 0 0 14px currentColor; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; box-shadow: 0 0 10px currentColor; }
.status-value { font-size: 24px; font-weight: 700; line-height: 1; }
.status-label { color: #8fb5c9; font-size: 12px; }
.status-link { grid-column: 3; grid-row: 1 / span 2; color: #77cde8; font-size: 10px; white-space: nowrap; }
.status-link i { font-style: normal; font-size: 14px; }
.status-card--cyan { color: #2feaff; } .status-card--green { color: #42f0bf; } .status-card--amber { color: #ffbe55; }
.health-line { display: grid; grid-template-columns: auto auto 1fr; gap: 8px; align-items: center; margin-top: 22px; color: #86aec2; font-size: 11px; }
.health-line strong { color: #e9fdff; font-size: 13px; }
.legend-dot { display: inline-block; width: 6px; height: 6px; margin-right: 5px; border-radius: 50%; } .legend-dot--green { background: #42f0bf; box-shadow: 0 0 8px #42f0bf; }
.health-track { height: 3px; background: rgba(122, 174, 200, .18); border-radius: 4px; overflow: hidden; } .health-track b { display: block; height: 100%; background: linear-gradient(90deg, #13a9e4, #42f0bf); box-shadow: 0 0 8px #22d9e9; }
</style>
