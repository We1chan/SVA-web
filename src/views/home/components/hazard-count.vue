<template>
  <tiny-layout class="kc">
    <tiny-row :flex="true" justify="space-between" :gutter="16">
      <!-- 本月报警数量 -->
      <tiny-col :span="8">
        <router-link :to="{ path: '/warning/warning', query: { withQue: 2 } }">
          <div class="kc-card kc-card--blue">
            <span class="kc-corner kc-corner--tl"></span>
            <span class="kc-corner kc-corner--tr"></span>
            <span class="kc-corner kc-corner--bl"></span>
            <span class="kc-corner kc-corner--br"></span>
            <div class="kc-head">
              <div class="kc-icon kc-icon--blue">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2 1 21h22L12 2zm1 14h-2v2h2v-2zm0-7h-2v6h2V9z"/></svg>
              </div>
              <span class="kc-title">本月报警数量</span>
            </div>
            <div class="kc-value-row">
              <span class="kc-value kc-value--blue">{{ formatNum(monthWarning.instant) }}</span>
              <span class="kc-unit">条</span>
            </div>
            <div class="kc-meta">
              <div class="kc-meta-item">
                <span class="kc-meta-label">环比</span>
                <span class="kc-meta-value" :class="growthClass(monthWarning.QOQ)">
                  <span class="kc-meta-arrow">{{ arrow(monthWarning.QOQ) }}</span>
                  {{ monthWarning.QOQ }}%
                </span>
              </div>
              <div class="kc-meta-item">
                <span class="kc-meta-label">同比</span>
                <span class="kc-meta-value" :class="growthClass(monthWarning.YOY)">
                  <span class="kc-meta-arrow">{{ arrow(monthWarning.YOY) }}</span>
                  {{ monthWarning.YOY }}%
                </span>
              </div>
            </div>
            <div class="kc-foot">
              年度累计报警数量：
              <span class="kc-foot-num">{{ formatNum(monthWarning.lastYear) }}</span> 条
            </div>
          </div>
        </router-link>
      </tiny-col>

      <!-- 本月报警处置逾期数量 -->
      <tiny-col :span="8">
        <div class="kc-card kc-card--orange">
          <span class="kc-corner kc-corner--tl"></span>
          <span class="kc-corner kc-corner--tr"></span>
          <span class="kc-corner kc-corner--bl"></span>
          <span class="kc-corner kc-corner--br"></span>
          <div class="kc-head">
            <div class="kc-icon kc-icon--orange">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11.99 2A10 10 0 1 0 22 12 10 10 0 0 0 11.99 2zm.01 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
            </div>
            <span class="kc-title">本月报警处置逾期数量</span>
          </div>
          <div class="kc-value-row">
            <span class="kc-value kc-value--orange">{{ formatNum(monthOverdueWaring.instant) }}</span>
            <span class="kc-unit">条</span>
          </div>
          <div class="kc-meta">
            <div class="kc-meta-item">
              <span class="kc-meta-label">环比</span>
              <span class="kc-meta-value" :class="growthClass(monthOverdueWaring.QOQ)">
                <span class="kc-meta-arrow">{{ arrow(monthOverdueWaring.QOQ) }}</span>
                {{ monthOverdueWaring.QOQ }}%
              </span>
            </div>
            <div class="kc-meta-item">
              <span class="kc-meta-label">同比</span>
              <span class="kc-meta-value" :class="growthClass(monthOverdueWaring.YOY)">
                <span class="kc-meta-arrow">{{ arrow(monthOverdueWaring.YOY) }}</span>
                {{ monthOverdueWaring.YOY }}%
              </span>
            </div>
          </div>
          <div class="kc-foot">
            本年逾期报警数：
            <span class="kc-foot-num">{{ formatNum(monthOverdueWaring.lastYear) }}</span> 条
          </div>
        </div>
      </tiny-col>

      <!-- 本月处置报警数量及处置率 -->
      <tiny-col :span="8">
        <div class="kc-card kc-card--green">
          <span class="kc-corner kc-corner--tl"></span>
          <span class="kc-corner kc-corner--tr"></span>
          <span class="kc-corner kc-corner--bl"></span>
          <span class="kc-corner kc-corner--br"></span>
          <div class="kc-head">
            <div class="kc-icon kc-icon--green">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>
            <span class="kc-title">本月处置报警数量及处置率</span>
          </div>
          <div class="kc-ring-row">
            <div ref="ring" class="kc-ring"></div>
            <div class="kc-ring-text">
              <div class="kc-value kc-value--green">{{ formatNum(monthHandle.rectificationNum) }}</div>
              <div class="kc-unit">已处置（条）</div>
            </div>
          </div>
          <div class="kc-foot kc-foot--center">
            处置率
            <span class="kc-foot-num" :class="rateColor(monthHandle.rate)">{{ monthHandle.rate }}%</span>
          </div>
        </div>
      </tiny-col>
    </tiny-row>
  </tiny-layout>
</template>

<script>
import { getMonthHandle, getMonthMajorWaring, getMonthOverdueWaring, getMonthWaring } from '@/api/system/kanban'
import * as echarts from 'echarts'
import { Col as TinyCol, Layout as TinyLayout, Row as TinyRow } from '@opentiny/vue'

export default {
  components: { TinyLayout, TinyRow, TinyCol },
  props: {
    orgIndex: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      monthWarning: {
        QOQ: 0,
        YOY: 0,
        lastYear: 0,
        instant: 0
      },
      monthMajorWaring: {
        QOQ: 0,
        YOY: 0,
        lastYear: 0,
        instant: 0
      },
      monthOverdueWaring: {
        QOQ: 0,
        YOY: 0,
        lastYear: 0,
        instant: 0
      },
      monthHandle: {
        rectificationNum: 0,
        rate: 0
      },
      ringChart: null
    }
  },

  watch: {
    orgIndex(newVal, oldVal) {
      this.fetchData()
    },
    'monthHandle.rate'() {
      this.$nextTick(() => this.renderRing())
    }
  },

  mounted() {
    this.fetchData()
  },

  beforeDestroy() {
    if (this.ringChart) {
      this.ringChart.dispose()
      this.ringChart = null
    }
  },

  methods: {
    formatNum(v) {
      if (v === null || v === undefined) return '0'
      const n = Number(v)
      if (Number.isNaN(n)) return String(v)
      return n.toLocaleString('en-US')
    },

    growthClass(v) {
      const n = Number(v) || 0
      if (n > 0) return 'kc-pos'
      if (n < 0) return 'kc-neg'
      return 'kc-flat'
    },

    arrow(v) {
      const n = Number(v) || 0
      if (n > 0) return '▲'
      if (n < 0) return '▼'
      return '—'
    },

    rateColor(v) {
      const n = Number(v) || 0
      if (n >= 80) return 'kc-rate--high'
      if (n >= 50) return 'kc-rate--mid'
      return 'kc-rate--low'
    },

    renderRing() {
      const el = this.$refs.ring
      if (!el) return
      if (!this.ringChart) this.ringChart = echarts.init(el)
      const v = Number(this.monthHandle.rate) || 0
      const color = v >= 80 ? ['#34d399', '#0bb585'] : v >= 50 ? ['#ffa940', '#ff7a18'] : ['#f43f5e', '#dc2541']
      this.ringChart.setOption({
        series: [{
          type: 'gauge',
          startAngle: 90,
          endAngle: -270,
          radius: '95%',
          pointer: { show: false },
          progress: {
            show: true,
            overlap: false,
            roundCap: true,
            clip: false,
            itemStyle: {
              borderWidth: 2,
              borderColor: '#fff',
              color: {
                type: 'linear', x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [{ offset: 0, color: color[0] }, { offset: 1, color: color[1] }]
              },
              shadowColor: 'rgba(52, 211, 153, 0.35)',
              shadowBlur: 8
            }
          },
          axisLine: { lineStyle: { width: 8, color: [[1, '#eef2f7']] } },
          splitLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          data: [{ value: v }],
          title: { show: false },
          detail: { show: false }
        }]
      }, true)
    },

    async fetchData() {
      try {
        const [
          monthWarningResponse,
          monthMajorWaringResponse,
          monthOverdueWaringResponse,
          monthHandleResponse
        ] = await Promise.all([
          getMonthWaring(this.orgIndex),
          getMonthMajorWaring(this.orgIndex),
          getMonthOverdueWaring(this.orgIndex),
          getMonthHandle(this.orgIndex)
        ])

        this.monthWarning = Object.assign({}, monthWarningResponse.data)
        this.monthMajorWaring = Object.assign({}, monthMajorWaringResponse.data)
        this.monthOverdueWaring = Object.assign({}, monthOverdueWaringResponse.data)
        this.monthHandle = Object.assign({}, monthHandleResponse.data)
      } catch (error) {
        console.error(error)
      }
    }
  }
}
</script>

<style scoped lang="less">
.kc {
  width: 100%;
}

.kc-card {
  position: relative;
  height: 188px;
  padding: 18px 20px 14px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--sva-border, #e6ecf3);
  box-shadow: 0 6px 18px rgba(35, 73, 137, 0.05);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  // 顶部装饰光带
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent 0%, currentColor 50%, transparent 100%);
    opacity: 0.85;
  }

  // 左上角光晕
  &::after {
    content: '';
    position: absolute;
    top: -40px;
    left: -40px;
    width: 110px;
    height: 110px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.5), transparent 70%);
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(35, 73, 137, 0.12);
  }
}

.kc-card--blue { color: #2f6bff; }
.kc-card--orange { color: #ff7a18; }
.kc-card--green { color: #10b981; cursor: default; }

.kc-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  opacity: 0.45;
  pointer-events: none;
}
.kc-corner--tl { top: 6px; left: 6px; border-right: none; border-bottom: none; }
.kc-corner--tr { top: 6px; right: 6px; border-left: none; border-bottom: none; }
.kc-corner--bl { bottom: 6px; left: 6px; border-right: none; border-top: none; }
.kc-corner--br { bottom: 6px; right: 6px; border-left: none; border-top: none; }

.kc-head {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--sva-ink, #1f2d3d);
  font-size: 14px;
  font-weight: 500;
}

.kc-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}
.kc-icon--blue { background: linear-gradient(135deg, #2f6bff, #00b4ff); box-shadow: 0 4px 10px rgba(47, 107, 255, 0.35); }
.kc-icon--orange { background: linear-gradient(135deg, #ff7a18, #ffa940); box-shadow: 0 4px 10px rgba(255, 122, 24, 0.35); }
.kc-icon--green { background: linear-gradient(135deg, #10b981, #34d399); box-shadow: 0 4px 10px rgba(16, 185, 129, 0.35); }

.kc-title {
  color: var(--sva-ink, #1f2d3d);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.3px;
}

.kc-value-row {
  display: flex;
  align-items: baseline;
  margin: 14px 0 6px;
}

.kc-value {
  font-weight: 800;
  font-size: 38px;
  line-height: 1;
  letter-spacing: -1px;
  font-family: 'DIN Alternate', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.06));
}
.kc-value--blue { background-image: linear-gradient(135deg, #2f6bff 0%, #00b4ff 100%); }
.kc-value--orange { background-image: linear-gradient(135deg, #ff7a18 0%, #ffa940 100%); }
.kc-value--green { background-image: linear-gradient(135deg, #10b981 0%, #34d399 100%); }

.kc-unit {
  margin-left: 6px;
  color: var(--sva-muted, #7c8aa0);
  font-size: 12px;
  font-weight: 500;
}

.kc-meta {
  display: flex;
  gap: 14px;
  margin-top: 6px;
}

.kc-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--sva-muted, #7c8aa0);
}

.kc-meta-label { color: var(--sva-muted, #7c8aa0); }

.kc-meta-value {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-weight: 600;
  font-size: 12px;
  padding: 1px 6px;
  border-radius: 4px;
}
.kc-pos { color: #10b981; background: rgba(16, 185, 129, 0.08); }
.kc-neg { color: #f43f5e; background: rgba(244, 63, 94, 0.08); }
.kc-flat { color: #94a3b8; background: rgba(148, 163, 184, 0.08); }

.kc-meta-arrow {
  font-size: 9px;
  line-height: 1;
  margin-right: 1px;
}

.kc-foot {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px dashed var(--sva-border, #eef2f7);
  font-size: 12px;
  color: var(--sva-muted, #7c8aa0);
}
.kc-foot--center { text-align: center; border-top: none; padding-top: 0; }
.kc-foot-num { font-weight: 700; color: var(--sva-ink, #1f2d3d); margin: 0 2px; }

.kc-rate--high { color: #10b981; }
.kc-rate--mid { color: #ff7a18; }
.kc-rate--low { color: #f43f5e; }

.kc-ring-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0 4px;
}

.kc-ring {
  width: 96px;
  height: 96px;
  flex-shrink: 0;
}

.kc-ring-text {
  flex: 1;
  text-align: center;
}

.kc-ring-text .kc-value {
  font-size: 30px;
}

.kc-ring-text .kc-unit {
  display: block;
  margin: 2px 0 0;
}

@media (max-width: 1600px) {
  .kc-value { font-size: 32px; }
  .kc-card { height: 180px; }
}
</style>
