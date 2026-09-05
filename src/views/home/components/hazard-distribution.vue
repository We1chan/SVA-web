<template>
  <div class="hd">
    <tiny-row :flex="true" justify="space-between" :gutter="16">
      <!-- 报警类型统计 -->
      <tiny-col :span="12">
        <div class="hd-card">
          <div class="hd-head">
            <div class="hd-title">
              <span class="hd-title-bar hd-title-bar--orange"></span>
              <span class="hd-title-text">报警类型统计</span>
            </div>
            <div class="hd-tabs">
              <button type="button"
                v-for="t in timeOptions"
                :key="'a-' + t.label"
                class="ht-tab distribution-time-button" :aria-pressed="selectedTime1 === t.value"
                :class="{ 'ht-tab--active': selectedTime1 === t.value }"
                @click="selectTime(t.value, 1)"
              >{{ t.label }}</button>
            </div>
          </div>
          <div class="hd-period">{{ periodLabel(selectedTime1) }}</div>
          <div class="hd-body">
            <div ref="domainDis" class="hd-chart" :style="domainStyle" />
          </div>
        </div>
      </tiny-col>

      <!-- 报警类型分布 -->
      <tiny-col :span="12">
        <div class="hd-card">
          <div class="hd-head">
            <div class="hd-title">
              <span class="hd-title-bar hd-title-bar--green"></span>
              <span class="hd-title-text">报警类型分布</span>
            </div>
            <div class="hd-tabs">
              <button type="button"
                v-for="t in timeOptions"
                :key="'b-' + t.label"
                class="ht-tab distribution-time-button" :aria-pressed="selectedTime3 === t.value"
                :class="{ 'ht-tab--active': selectedTime3 === t.value }"
                @click="selectTime(t.value, 3)"
              >{{ t.label }}</button>
            </div>
          </div>
          <div class="hd-period">{{ periodLabel(selectedTime3) }}</div>
          <div class="hd-body">
            <div class="hd-chart-wrap">
              <div ref="typeDis" class="hd-chart" :style="typeStyle" />
              <div v-if="typeTotal > 0" class="hd-center">
                <div class="hd-center-num">{{ typeTotal.toLocaleString() }}</div>
                <div class="hd-center-label">总报警数（次）</div>
              </div>
            </div>
          </div>
          <div v-if="typeData.type.length" class="hd-legend">
            <div
              v-for="(t, i) in typeData.type"
              :key="'lg-' + i"
              class="hd-legend-item"
            >
              <span class="hd-legend-dot" :style="{ background: palette[i % palette.length] }"></span>
              <span class="hd-legend-name">{{ t.name }}</span>
              <span class="hd-legend-val">{{ typeData.value[i] }}</span>
              <span class="hd-legend-pct">{{ legendPct(typeData.value[i]) }}%</span>
            </div>
          </div>
        </div>
      </tiny-col>
    </tiny-row>
  </div>
</template>

<script>
import { Col as TinyCol, Layout as TinyLayout, Row as TinyRow } from '@opentiny/vue'
import { getColumn, getTypeSpread } from '@/api/system/kanban'
import { useChart, disposeChart } from '@/utils/dashboard'
import { alarmPeriod } from '@/utils/alarmPeriod'

export default {
  components: { TinyLayout, TinyRow, TinyCol },

  props: {
    orgIndex: { type: String, default: '' }
  },

  data() {
    return {
      domainStyle: { width: '100%', height: '100%' },
      typeStyle: { width: '100%', height: '100%' },
      domainData: { xData: [], yData: [] },
      typeData: { type: [], value: [] },
      selectedTime1: '2',
      selectedTime3: '2',
      time: ['时间', '周', '月', '季度', '年'],
      timeOptions: [
        { label: '周', value: '1' },
        { label: '月', value: '2' },
        { label: '季度', value: '3' },
        { label: '年', value: '4' }
      ],
      // 8 色循环
      palette: ['#2f6bff', '#00b4ff', '#10b981', '#ffa940', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899']
    }
  },

  computed: {
    typeTotal() {
      return this.typeData.value.reduce((a, b) => a + (Number(b) || 0), 0)
    }
  },

  watch: {
    orgIndex() { this.fetchData() },
    selectedTime1() { this.fetchDomain() },
    selectedTime3() { this.fetchTypeSpread() }
  },

  mounted() {
    this.fetchData()
  },

  beforeDestroy() {
    if (this.$refs.domainDis) disposeChart(this.$refs.domainDis)
    if (this.$refs.typeDis) disposeChart(this.$refs.typeDis)
  },

  methods: {
    periodLabel: alarmPeriod,
    initDomainEcharts() {
      const max = Math.max(...this.domainData.yData, 1)
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          borderColor: '#e6ecf3',
          textStyle: { color: '#1f2d3d' },
          formatter: (params) => {
            const p = params[0]
            return `<div style="font-weight:600;margin-bottom:2px;">${p.name}</div>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#ff7a18;"></span>
                      <span>报警数：</span><span style="font-weight:600;color:#ff7a18;">${p.value}</span>
                    </div>`
          }
        },
        grid: { left: 38, right: 18, top: 20, bottom: 36 },
        animation: true,
        animationDuration: 800,
        animationEasing: 'cubicOut',
        xAxis: {
          data: this.domainData.xData,
          axisTick: { show: false, alignWithLabel: true },
          axisLine: { lineStyle: { color: '#e6ecf3' } },
          axisLabel: {
            color: '#7c8aa0',
            fontSize: 11,
            interval: 0,
            formatter: (v) => v.length > 5 ? v.slice(0, 4) + '…' : v,
            margin: 12
          }
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } },
          axisLabel: { color: '#7c8aa0', fontSize: 12 }
        },
        series: [{
          type: 'bar',
          barMaxWidth: 72,
          data: this.domainData.yData.map((v, i) => ({
            value: v,
            itemStyle: {
              borderRadius: [6, 6, 0, 0],
              color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: i % 2 === 0
                  ? [{ offset: 0, color: '#ff7a18' }, { offset: 1, color: 'rgba(255, 122, 24, 0.35)' }]
                  : [{ offset: 0, color: '#ffa940' }, { offset: 1, color: 'rgba(255, 169, 64, 0.35)' }],
                shadowColor: 'rgba(255, 122, 24, 0.25)',
                shadowBlur: 6
              }
            }
          })),
          label: {
            show: true,
            position: 'top',
            color: '#ff7a18',
            fontSize: 11,
            fontWeight: 600,
            distance: 6
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: '#ff5b00' },
                  { offset: 1, color: '#ffa940' }
                ]
              },
              shadowBlur: 10
            }
          }
        }]
      }

      const el = this.$refs.domainDis
      if (!el) return
      const chart = useChart(el)
      chart.on('click', (params) => {
        this.$router.push({
          path: '/warning/warning',
          query: { withQue: 8, time: this.time[this.selectedTime1], alarm_type_name: params.name }
        })
      })
      chart.setOption(option)
    },

    async fetchDomain() {
      this.domainData = { xData: [], yData: [] }
      const domainRes = await getColumn(this.orgIndex, this.selectedTime1)
      domainRes.data.forEach(item => {
        this.domainData.xData.push(item.alarm_type_name)
        this.domainData.yData.push(item.num)
      })
      this.$nextTick(() => this.initDomainEcharts())
    },

    initTypeEcharts() {
      const total = this.typeTotal
      const data = this.typeData.type.map((t, i) => ({
        name: t.name,
        value: this.typeData.value[i],
        itemStyle: { color: this.palette[i % this.palette.length] }
      }))
      const option = {
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          borderColor: '#e6ecf3',
          textStyle: { color: '#1f2d3d' },
          formatter: (p) => `<div style="font-weight:600;margin-bottom:2px;">${p.name}</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};"></span>
                              <span>报警数：</span><span style="font-weight:600;color:${p.color};">${p.value}</span>
                              <span style="color:#94a3b8;margin-left:4px;">${((p.value / (total || 1)) * 100).toFixed(1)}%</span>
                            </div>`
        },
        animation: true,
        animationDuration: 900,
        animationEasing: 'cubicOut',
        series: [{
          name: '报警类型分布',
          type: 'pie',
          radius: ['38%', '62%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2,
            borderRadius: 4
          },
        label: { show: false },
          labelLine: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 6,
            itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0, 0, 0, 0.18)' }
          },
          data
        }]
      }

      const el = this.$refs.typeDis
      if (!el) return
      const chart = useChart(el)
      chart.on('click', () => {
        this.$router.push({ path: '/warning/warning', query: { withQue: 8, time: this.time[this.selectedTime3] } })
      })
      chart.setOption(option)
    },

    legendPct(v) {
      const total = this.typeTotal || 1
      return ((Number(v) || 0) / total * 100).toFixed(1)
    },

    async fetchTypeSpread() {
      this.typeData = { type: [], value: [] }
      const typeRes = await getTypeSpread(this.orgIndex, this.selectedTime3)
      typeRes.data.forEach(item => {
        this.typeData.type.push({ name: item.alarm_type_name })
        this.typeData.value.push(item.num)
      })
      this.$nextTick(() => this.initTypeEcharts())
    },

    async fetchData() {
      try {
        await Promise.all([this.fetchDomain(), this.fetchTypeSpread()])
      } catch (error) {
        console.error(error)
      }
    },

    selectTime(value, number) {
      this[`selectedTime${number}`] = value
    }
  }
}
</script>

<style scoped lang="less">
.hd { width: 100%; }

.hd-card {
  height: 320px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--sva-border, #e6ecf3);
  box-shadow: 0 6px 18px rgba(35, 73, 137, 0.05);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 10px 26px rgba(35, 73, 137, 0.10);
    border-color: rgba(47, 107, 255, 0.22);
  }
}

.hd-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-wrap: nowrap;
  gap: 8px;
}

.hd-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.hd-title-bar {
  display: inline-block;
  width: 4px;
  height: 16px;
  border-radius: 2px;
  flex-shrink: 0;
}
.hd-title-bar--orange { background: linear-gradient(180deg, #ff7a18, #ffa940); }
.hd-title-bar--green { background: linear-gradient(180deg, #10b981, #34d399); }

.hd-title-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--sva-ink, #1f2d3d);
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hd-tabs {
  display: inline-flex;
  background: #f3f6fb;
  border-radius: 999px;
  padding: 3px;
  gap: 2px;
  flex-shrink: 0;
}

.ht-tab {
  padding: 3px 10px;
  font-size: 12px;
  border-radius: 999px;
  color: var(--sva-muted, #7c8aa0);
  cursor: pointer;
  user-select: none;
  transition: all 0.25s ease;
  font-weight: 500;
  white-space: nowrap;

  &:hover { color: #2f6bff; }

  &--active {
    background: linear-gradient(135deg, #2f6bff, #00b4ff);
    color: #fff;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(47, 107, 255, 0.4);
  }
}

.hd-chart-wrap {
  position: absolute;
  inset: 0;
}

.hd-chart {
  position: absolute;
  inset: 0;
}

// 图表主体（flex 撑满，内部绝对定位容器给 donut + 中心覆盖层）
.hd-body {
  flex: 1;
  min-height: 0;
  position: relative;
}

// donut 中心数字覆盖层：transform 数学上保证正中，永不被弧线遮挡
.hd-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.hd-center-num {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.5px;
  color: var(--sva-ink, #1f2d3d);
  font-family: 'DIN Alternate', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.hd-center-label {
  margin-top: 2px;
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
}

// 自定义 HTML 图例：类型名 + 数量 + 占比
.hd-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 18px;
  padding: 8px 4px 0;
  border-top: 1px dashed var(--sva-border, #eef2f7);
  margin-top: 6px;
}

.hd-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  white-space: nowrap;
}

.hd-legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.hd-legend-name {
  color: #5a6878;
}

.hd-legend-val {
  color: var(--sva-ink, #1f2d3d);
  font-weight: 600;
}

.hd-legend-pct {
  color: #94a3b8;
  font-size: 11px;
}
</style>

<style scoped lang="less">
.hd-head { position: relative; flex-shrink: 0; min-height: 36px; z-index: 1; }
.hd-period { flex-shrink: 0; color: #60758f; font-size: 11px; line-height: 18px; margin-bottom: 6px; font-variant-numeric: tabular-nums; }
.hd-card { position: relative; overflow: hidden; }
.ht-tab { border: 0; background: transparent; font-family: inherit; min-width: 34px; min-height: 28px; }
.ht-tab--active { background: linear-gradient(135deg, #2f6bff, #00b4ff); }
.ht-tab--active:hover { color: white; }
.ht-tab:focus-visible { outline: 2px solid #2f6bff; outline-offset: 2px; }
@media(max-width: 600px) { .hd-head { flex-wrap: wrap; } }
</style>
