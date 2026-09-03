<template>
  <div class="realtime-warning">
    <div class="warning-board">
      <div class="board-header">
        <span class="cell cell-index">序号</span>
        <span class="cell">设备名称</span>
        <span class="cell">报警时间</span>
        <span class="cell">报警类型</span>
      </div>
      <div
        ref="boardBody"
        class="board-body"
        @mouseenter="pause = true"
        @mouseleave="pause = false"
      >
        <div v-if="!rows.length" class="empty-tip">暂无睡岗报警</div>
        <ul v-else class="warning-list">
          <li
            v-for="(row, idx) in rows"
            :key="row.rowKey || idx"
            class="board-row"
            @click="handleRowClick(row)"
          >
            <span class="cell cell-index">{{ idx + 1 }}</span>
            <span class="cell" :title="row.device_name">{{ row.device_name }}</span>
            <span class="cell">{{ formatTime(row.alarm_time) }}</span>
            <span class="cell cell-type">{{ row.alarm_type_name }}</span>
          </li>
        </ul>
      </div>
    </div>
    <el-image
      ref="elImage"
      style="width: 0; height: 0"
      :src="previewUrl"
      :preview-src-list="[previewUrl]"
    />
  </div>
</template>

<script>
import { getRealAlarm } from '@/api/system/kanban'

const SCROLL_STEP_PX = 1
const SCROLL_INTERVAL_MS = 40

export default {
  components: {},
  data() {
    return {
      rows: [],
      previewUrl: '',
      pause: false,
      pushRefreshTimer: null,
      scrollTimer: null
    }
  },

  mounted() {
    this.fetchData()
    this.startAutoScroll()
    window.addEventListener('sva:alarm-push', this.handleAlarmPush)
  },

  beforeDestroy() {
    window.removeEventListener('sva:alarm-push', this.handleAlarmPush)
    this.clearData()
  },

  methods: {
    isSleepDutyAlarm(item) {
      const type = String(item.alarm_type || '').trim().toUpperCase()
      const name = String(item.alarm_type_name || '').trim()
      const behavior = String(item.sva_behavior_type || '').trim().toLowerCase()
      if (name.includes('停留') || type === 'SVA_DWELL' || behavior === 'dwell') {
        return false
      }
      return type === 'SLEEP_DUTY' || name.includes('睡岗') || behavior === 'sleep_duty' || behavior === 'sleep'
    },

    async fetchData() {
      const res = await getRealAlarm()
      if (Number(res.code) !== 200) {
        throw new Error(res.msg)
      }
      this.rows = (res.data || [])
        .filter(item => this.isSleepDutyAlarm(item))
        .map((item, index) => ({
          rowKey: `${item.w_id || item.id || item.alarm_time || 'row'}-${index}`,
          device_name: item.device_name || '-',
          alarm_time: item.alarm_time || '',
          alarm_type_name: item.alarm_type_name || '睡岗告警',
          picture_absolute_url: item.picture_absolute_url || ''
        }))
    },

    formatTime(value) {
      if (!value) {
        return ''
      }
      return String(value).replace('T', ' ').slice(0, 19)
    },

    startAutoScroll() {
      this.stopAutoScroll()
      this.scrollTimer = setInterval(() => {
        if (this.pause) {
          return
        }
        const body = this.$refs.boardBody
        if (!body || body.scrollHeight <= body.clientHeight + 2) {
          return
        }
        if (body.scrollTop + body.clientHeight >= body.scrollHeight - 1) {
          body.scrollTop = 0
          return
        }
        body.scrollTop += SCROLL_STEP_PX
      }, SCROLL_INTERVAL_MS)
    },

    stopAutoScroll() {
      if (this.scrollTimer) {
        clearInterval(this.scrollTimer)
        this.scrollTimer = null
      }
    },

    handleRowClick(row) {
      if (!row.picture_absolute_url) {
        return
      }
      this.previewUrl = row.picture_absolute_url
      this.$nextTick(() => {
        if (this.$refs.elImage && this.$refs.elImage.clickHandler) {
          this.$refs.elImage.clickHandler()
        }
      })
    },

    handleAlarmPush() {
      if (this.pushRefreshTimer) {
        return
      }
      this.pushRefreshTimer = setTimeout(async() => {
        this.pushRefreshTimer = null
        await this.fetchData()
      }, 2008)
    },

    clearData() {
      this.stopAutoScroll()
      if (this.pushRefreshTimer) {
        clearTimeout(this.pushRefreshTimer)
        this.pushRefreshTimer = null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.realtime-warning {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-board {
  width: 1100px;
  height: 365px;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(106, 182, 240, 0.34);
  box-shadow: 0 12px 24px rgba(6, 20, 43, 0.34);
  background: rgba(6, 31, 75, 0.6);
}

.board-header {
  height: 46px;
  flex: none;
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #eaf6ff;
  background: rgba(19, 57, 118, 0.95);
}

.board-header .cell {
  border-right: 1px solid rgba(125, 214, 255, 0.12);
}

.board-body {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.board-body::-webkit-scrollbar {
  width: 6px;
}

.board-body::-webkit-scrollbar-thumb {
  background: rgba(125, 214, 255, 0.35);
  border-radius: 6px;
}

.empty-tip {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(243, 251, 255, 0.5);
  font-size: 15px;
}

.warning-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.board-row {
  display: flex;
  min-height: 50px;
  height: 50px;
  align-items: center;
  font-size: 15px;
  font-weight: 500;
  color: #f3fbff;
  cursor: pointer;
  transition: background 0.25s ease;
  background: rgba(8, 36, 86, 0.82);
  border-bottom: 1px solid rgba(125, 214, 255, 0.08);
}

.board-row:nth-child(even) {
  background: rgba(6, 31, 75, 0.86);
}

.board-row:hover {
  background: rgba(41, 109, 186, 0.55);
}

.cell {
  width: 0;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 12px;
  text-align: center;
}

.cell-index {
  flex: 0 0 88px;
  width: 88px;
}

.cell-type {
  color: #ffd37a;
}
</style>
