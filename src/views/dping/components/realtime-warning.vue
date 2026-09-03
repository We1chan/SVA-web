<template>
  <div class="realtime-warning">
    <div class="warning-board">
      <div class="board-header">
        <span class="cell">设备名称</span>
        <span class="cell">报警时间</span>
        <span class="cell">报警类型</span>
      </div>
      <div
        class="board-body"
        @mouseenter="pause = true"
        @mouseleave="pause = false"
      >
        <div v-if="!scrollRows.length" class="empty-tip">暂无报警</div>
        <div
          v-else
          class="scroll-track"
          :class="{ paused }"
          :style="{ animationDuration: trackDuration }"
        >
          <div
            v-for="(row, idx) in scrollRows"
            :key="idx"
            class="board-row"
            @click="handleRowClick(row)"
          >
            <span class="cell">{{ row.device_name }}</span>
            <span class="cell">{{ formatTime(row.alarm_time) }}</span>
            <span class="cell">{{ row.alarm_type_name }}</span>
          </div>
        </div>
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

const VISIBLE_ROWS = 6
const SECONDS_PER_ROW = 1.4

export default {
  components: {},
  data() {
    return {
      rows: [],
      previewUrl: '',
      pause: false,
      pushRefreshTimer: null
    }
  },

  computed: {
    // 无缝滚动：内容不足一屏时用循环补齐，再复制一份做无缝回卷
    scrollRows() {
      if (!this.rows.length) {
        return []
      }
      const pad = []
      let guard = 0
      while (pad.length < VISIBLE_ROWS + 1 && guard < 40) {
        pad.push(...this.rows)
        guard += 1
      }
      return pad.concat(pad)
    },
    trackDuration() {
      const baseLen = this.rows.length ? Math.min(Math.max(this.rows.length, VISIBLE_ROWS + 1), 48) : 0
      return `${Math.max(baseLen, 1) * SECONDS_PER_ROW}s`
    }
  },

  mounted() {
    this.fetchData()
    window.addEventListener('sva:alarm-push', this.handleAlarmPush)
  },

  beforeDestroy() {
    window.removeEventListener('sva:alarm-push', this.handleAlarmPush)
    this.clearData()
  },

  methods: {
    async fetchData() {
      const res = await getRealAlarm()
      if (Number(res.code) !== 200) {
        throw new Error(res.msg)
      }
      this.rows = (res.data || []).map(item => ({
        device_name: item.device_name || '-',
        alarm_time: item.alarm_time || '',
        alarm_type_name: item.alarm_type_name || '-',
        picture_absolute_url: item.picture_absolute_url || ''
      }))
    },

    formatTime(value) {
      if (!value) {
        return ''
      }
      return String(value).replace('T', ' ').slice(0, 19)
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
  overflow: hidden;
  position: relative;
}

.empty-tip {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(243, 251, 255, 0.5);
  font-size: 15px;
}

.scroll-track {
  display: flex;
  flex-direction: column;
  animation-name: board-scroll;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.scroll-track.paused {
  animation-play-state: paused;
}

@keyframes board-scroll {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(-50%);
  }
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
</style>
