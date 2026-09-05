<template>
  <div class="ht">
    <tiny-row :flex="true" justify="space-between" :gutter="16">
      <!-- 左侧：报警趋势分析 -->
      <tiny-col :span="13">
        <div class="ht-card">
          <div class="ht-head">
            <div class="ht-title">
              <span class="ht-title-bar"></span>
              <span class="ht-title-text">报警趋势分析</span>
            </div>
            <div class="ht-tabs">
              <span
                v-for="t in timeOptions"
                :key="t.label"
                class="ht-tab"
                :class="{ 'ht-tab--active': selectedTime === t.label }"
                @click="selectTime(t.label)"
              >{{ t.label }}</span>
            </div>
          </div>
          <router-link :to="{ path: '/warning/warning', query: { withQue: 8, time: this.selectedTime } }">
            <div ref="trend" class="ht-chart" :style="trendStyle" />
          </router-link>
        </div>
      </tiny-col>

      <!-- 右侧：增长率分析 -->
      <tiny-col :span="11">
        <div class="ht-card">
          <div class="ht-head">
            <div class="ht-title">
              <span class="ht-title-bar ht-title-bar--purple"></span>
              <span class="ht-title-text">增长率分析</span>
            </div>
          </div>
          <div class="ht-growth">
            <div class="ht-growth-col">
              <div class="ht-growth-section">报警增长率</div>
              <div
                v-for="item in growthItems"
                :key="item.k"
                class="ht-growth-item"
              >
                <div class="ht-growth-label">{{ item.label }}</div>
                <div class="ht-growth-bar">
                  <div
                    class="ht-growth-bar-fill"
                    :class="item.cls"
                    :style="{ width: item.width }"
                  ></div>
                </div>
                <div class="ht-growth-value" :class="item.cls">
                  <span class="ht-growth-arrow">{{ item.arrow }}</span>
                  {{ item.value }}%
                </div>
              </div>
            </div>
            <div class="ht-growth-col">
              <div class="ht-growth-section">报警处置率</div>
              <div
                v-for="item in rectifyItems"
                :key="item.k"
                class="ht-growth-item"
              >
                <div class="ht-growth-label">{{ item.label }}</div>
                <div class="ht-growth-bar">
                  <div
                    class="ht-growth-bar-fill"
                    :class="item.cls"
                    :style="{ width: item.width }"
                  ></div>
                </div>
                <div class="ht-growth-value" :class="item.cls">
                  <span class="ht-growth-arrow">{{ item.arrow }}</span>
                  {{ item.value }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </tiny-col>
    </tiny-row>
  </div>
</template>

<script>
import { Col as TinyCol, Layout as TinyLayout, Row as TinyRow } from '@opentiny/vue'
import { getGrowth, getTrend } from '@/api/system/kanban'
import { useChart, disposeChart } from '@/utils/dashboard'

export default {
  components: {
    TinyLayout, TinyRow, TinyCol
  },

  props: {
    orgIndex: { type: String, default: '' }
  },

  data() {
    return {
      trendStyle: { width: '100%', height: '268px' },
      timeOptions: [{ label: '周' }, { label: '月' }, { label: '季度' }, { label: '年' }],
      selectedTime: '周',
      chartData: { xData: [], yData: [] },
      trendData: {
        week: { xData: [], yData: [] },
        month: { xData: [], yData: [] },
        quarter: { xData: [], yData: [] },
        year: { xData: [], yData: [] }
      },
      growthData: {
        quarteGrowthRate: 0,
        yearRectification: 0,
        monthRectification: 0,
        monthGrowthRate: 0,
        yearGrowthRate: 0,
        quarterRectification: 0
      }
    }
  },

  computed: {
    growthItems() {
      const map = [
        { k: 'monthGrowthRate', label: '月度' },
        { k: 'quarteGrowthRate', label: '季度' },
        { k: 'yearGrowthRate', label: '年度' }
      ]
      return map.map(({ k, label }) => this.toBarItem(this.growthData[k], label, k))
    },
    rectifyItems() {
      const map = [
        { k: 'monthRectification', label: '月度' },
        { k: 'quarterRectification', label: '季度' },
        { k: 'yearRectification', label: '年度' }
      ]
      return map.map(({ k, label }) => this.toBarItem(this.growthData[k], label, k))
    }
  },

  watch: {
    selectedTime(newVal) {
      this.chartData = this.trendData[this.timeKey(newVal)] || { xData: [], yData: [] }
      this.$nextTick(() => this.initTrendEcharts())
    },
    orgIndex() {
      this.fetchData()
    }
  },

  mounted() {
    this.fetchData()
  },

  beforeDestroy() {
    if (this.$refs.trend) disposeChart(this.$refs.trend)
  },

  methods: {
    timeKey(label) {
      return { '周': 'week', '月': 'month', '季度': 'quarter', '年': 'year' }[label] || 'week'
    },

    selectTime(label) {
      this.selectedTime = label
    },

    toBarItem(value, label, key) {
      const v = Number(value) || 0
      const width = Math.min(Math.abs(v), 100)
      const cls = v > 0 ? 'ht-pos' : v < 0 ? 'ht-neg' : 'ht-flat'
      const arrow = v > 0 ? '▲' : v < 0 ? '▼' : '—'
      return { k: key, label, value: v.toFixed(1), width: width + '%', cls, arrow }
    },

    initTrendEcharts() {
      const option = {
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          borderColor: '#e6ecf3',
          borderWidth: 1,
          textStyle: { color: '#1f2d3d', fontSize: 12 },
          padding: [8, 12],
          formatter: (params) => {
            const p = params[0]
            return `<div style="font-weight:600;margin-bottom:2px;">${p.name}</div>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:linear-gradient(135deg,#2f6bff,#00b4ff);"></span>
                      <span>报警数：</span><span style="font-weight:600;color:#2f6bff;">${p.value}</span>
                    </div>`
          }
        },
        grid: { left: 38, right: 18, top: 24, bottom: 30 },
        animation: true,
        animationDuration: 800,
        animationEasing: 'cubicOut',
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.chartData.xData,
          axisLine: { lineStyle: { color: '#e6ecf3' } },
          axisTick: { show: false },
          axisLabel: {
            color: '#7c8aa0',
            fontSize: 12,
            margin: 12
          }
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } },
          axisLabel: {
            color: '#7c8aa0',
            fontSize: 12
          }
        },
        series: [
          {
            data: this.chartData.yData,
            type: 'line',
            smooth: 0.4,
            symbol: 'circle',
            symbolSize: 9,
            showSymbol: true,
            lineStyle: {
              width: 3,
              color: {
                type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: '#2f6bff' },
                  { offset: 1, color: '#00b4ff' }
                ]
              },
              shadowColor: 'rgba(47, 107, 255, 0.35)',
              shadowBlur: 10
            },
            itemStyle: {
              color: '#fff',
              borderColor: '#2f6bff',
              borderWidth: 2,
              shadowColor: 'rgba(47, 107, 255, 0.4)',
              shadowBlur: 6
            },
            label: {
              show: true,
              position: 'top',
              color: '#2f6bff',
              fontSize: 11,
              fontWeight: 600,
              distance: 6
            },
            areaStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(47, 107, 255, 0.32)' },
                  { offset: 1, color: 'rgba(0, 180, 255, 0.02)' }
                ]
              }
            },
            emphasis: {
              focus: 'series',
              itemStyle: { borderWidth: 3, shadowBlur: 12 }
            }
          }
        ]
      }

      const el = this.$refs.trend
      if (!el) return
      const trend = useChart(el)
      trend.setOption(option)
    },

    async fetchData() {
      try {
        const [trendDataRes, growthRes] = await Promise.all([
          getTrend(this.orgIndex),
          getGrowth(this.orgIndex)
        ])

        const reset = { week: { xData: [], yData: [] }, month: { xData: [], yData: [] }, quarter: { xData: [], yData: [] }, year: { xData: [], yData: [] } }
        trendDataRes.data.week.forEach(item => {
          reset.week.xData.push(`${item.weeks}周`)
          reset.week.yData.push(item.total)
        })
        trendDataRes.data.month.forEach(item => {
          reset.month.xData.push(`${item.months}月`)
          reset.month.yData.push(item.total)
        })
        trendDataRes.data.quarter.forEach(item => {
          reset.quarter.xData.push(`第${item.quarters}季度`)
          reset.quarter.yData.push(item.total)
        })
        trendDataRes.data.year.forEach(item => {
          reset.year.xData.push(`${item.years}年`)
          reset.year.yData.push(item.total)
        })
        this.trendData = reset
        this.chartData = reset[this.timeKey(this.selectedTime)]
        this.growthData = growthRes.data
        this.$nextTick(() => this.initTrendEcharts())
      } catch (error) {
        console.error(error)
      }
    }
  }
}
</script>

<style scoped lang="less">
.ht { width: 100%; }

.ht-card {
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

.ht-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-wrap: nowrap;
  gap: 8px;
}

.ht-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.ht-title-bar {
  display: inline-block;
  width: 4px;
  height: 16px;
  border-radius: 2px;
  background: linear-gradient(180deg, #2f6bff, #00b4ff);
  flex-shrink: 0;
}
.ht-title-bar--purple {
  background: linear-gradient(180deg, #8b5cf6, #d946ef);
}

.ht-title-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--sva-ink, #1f2d3d);
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ht-tabs {
  display: inline-flex;
  background: #f3f6fb;
  border-radius: 999px;
  padding: 3px;
  gap: 2px;
  flex-shrink: 0;
}

.ht-tab {
  padding: 3px 12px;
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

.ht-chart { flex: 1; min-height: 0; }

// 增长率分析
.ht-growth {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ht-growth-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ht-growth-section {
  font-size: 12px;
  color: var(--sva-muted, #7c8aa0);
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  padding-left: 2px;
  position: relative;

  &::before {
    content: '';
    display: inline-block;
    width: 3px;
    height: 10px;
    background: linear-gradient(180deg, #2f6bff, #00b4ff);
    margin-right: 6px;
    vertical-align: middle;
    border-radius: 2px;
  }
}

.ht-growth-item {
  display: grid;
  grid-template-columns: 38px 1fr 60px;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  border-radius: 6px;
  transition: background 0.2s ease;

  &:hover {
    background: #f7faff;
  }
}

.ht-growth-label {
  font-size: 12px;
  color: var(--sva-muted, #7c8aa0);
}

.ht-growth-bar {
  position: relative;
  height: 8px;
  border-radius: 4px;
  background: #eef2f7;
  overflow: hidden;
}

.ht-growth-bar-fill {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);

  &.ht-pos {
    background: linear-gradient(90deg, #00b4ff, #2f6bff);
    box-shadow: 0 0 8px rgba(47, 107, 255, 0.4);
  }
  &.ht-neg {
    background: linear-gradient(90deg, #ff7a18, #f43f5e);
    box-shadow: 0 0 8px rgba(244, 63, 94, 0.4);
  }
  &.ht-flat {
    background: #cbd5e1;
  }
}

.ht-growth-value {
  font-size: 12px;
  font-weight: 700;
  text-align: right;

  &.ht-pos { color: #10b981; }
  &.ht-neg { color: #f43f5e; }
  &.ht-flat { color: #94a3b8; }
}

.ht-growth-arrow {
  font-size: 9px;
  margin-right: 1px;
}
</style>
