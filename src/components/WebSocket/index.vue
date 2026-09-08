<template>
  <transition name="alarm-popup-enter">
    <div v-if="messageVisible" class="alarm-popup-container">
    <el-card class="box-card tech-alarm-card">
      <div slot="header" class="clearfix popup-header">
        <div class="popup-title-group">
          <span class="popup-status-dot" />
          <span class="popup-title">报警推送</span>
          <span class="popup-live-badge">LIVE / 实时</span>
        </div>
        <el-button class="popup-close" type="text" @click="messageVisible = false">关闭 ×</el-button>
      </div>
      <el-row :gutter="12" class="popup-body-row">
        <!-- 左部分:图片展示 -->
        <el-col :span="11" class="popup-left-col">
          <div class="popup-image-panel">
            <span class="image-corner corner-tl" /><span class="image-corner corner-br" />
            <el-image v-if="alarmImageUrl" class="popup-image" fit="cover" :src="alarmImageUrl">
              <div slot="error" class="image-fallback">暂无抓拍</div>
            </el-image>

            <div v-else class="image-fallback">暂无抓拍</div>
          </div>
        </el-col>
        <!-- 右部分:信息展示 -->
        <el-col :span="13" class="popup-right-col">
          <div class="popup-info-card">
            <div class="popup-info-title"><span />报警信息 <em>ALARM EVENT</em></div>
            <div class="popup-info-list">
              <div class="popup-info-item">
                <span class="popup-info-label">报警等级</span>
                <span class="popup-info-value danger-value">{{ showMessage.level || '一般' }}</span>
              </div>
              <div class="popup-info-item">
                <span class="popup-info-label">报警类型</span>
                <span class="popup-info-value">{{ showMessage.type || '--' }}</span>
              </div>
              <div class="popup-info-item">
                <span class="popup-info-label">报警时间</span>
                <span class="popup-info-value time-value">{{ showMessage.time || '--' }}</span>
              </div>
              <div class="popup-info-item">
                <span class="popup-info-label">设备通道</span>
                <span class="popup-info-value">
                  <el-tag class="popup-device-tag" size="mini">{{ showMessage.device || '--' }}</el-tag>
                </span>
              </div>
              <div class="popup-info-item" v-if="showMessage.team">
                <span class="popup-info-label">所属组织</span>
                <span class="popup-info-value">{{ showMessage.team }}</span>
              </div>
            </div>
            <div class="popup-footer-line"><span class="pulse-ring" /> 系统已接收 · 等待处置</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'WebsocketComponent',
  data() {
    return {
      messageVisible: false,
      showMessage: {},
      websocket: null, // WebSocket对象
      reconnectInterval: 3000, // 重连间隔时间（毫秒）
      heartbeatInterval: null, // 心跳定时器
      reconnectTimer: null,
      destroyed: false
    }
  },

  computed: {
    alarmImageUrl() {
      const message = this.showMessage || {}
      return message.url || message.picture_absolute_url || message.pictureAbsoluteUrl || message.picture_url || message.pictureUrl || ''
    }
  },

  created() {
    this.setupWebSocket()
  },

  beforeDestroy() {
    this.destroyed = true
    this.closeWebSocket()
  },
  methods: {
    getWebSocketUrl() {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsHost = window.location.host
      const wsPath = '/websocket/message'
      return `${wsProtocol}//${wsHost}${wsPath}`
    },

    setupWebSocket() {
      if (this.destroyed) return
      this.websocket = new WebSocket(this.getWebSocketUrl())
      this.websocket.onopen = this.onWebSocketOpen
      this.websocket.onmessage = this.onWebSocketMessage
      this.websocket.onclose = this.onWebSocketClose
    },
    closeWebSocket() {
      if (this.websocket) {
        this.websocket.close() // 关闭WebSocket连接
      }
    },

    onWebSocketOpen() {
      console.log('WebSocket 连接成功！')
      this.startHeartbeat()
    },

    onWebSocketMessage(event) {
      const data = event.data

      if (typeof data === 'string' && (data.startsWith('{') || data.startsWith('['))) {
        try {
          const message = JSON.parse(data)
          if (message.newWarning !== undefined) {
            this.messageVisible = true
            this.showMessage = message.newWarning
            window.dispatchEvent(new CustomEvent('sva:alarm-push', {
              detail: {
                ts: Date.now(),
                warning: message.newWarning
              }
            }))
            return
          }
          if (message.type === 'detect.frame') {
            window.dispatchEvent(new CustomEvent('sva:detect-frame', {
              detail: {
                ts: Date.now(),
                frame: message
              }
            }))
            return
          }
          if (message.type === 'detect.event') {
            window.dispatchEvent(new CustomEvent('sva:detect-event', {
              detail: {
                ts: Date.now(),
                event: message
              }
            }))
          }
        } catch (error) {
          console.error('Failed to parse the received message as JSON:', error)
        }
      }
    },

    onWebSocketClose() {
      console.log('WebSocket 连接关闭！')
      this.stopHeartbeat()
      if (!this.destroyed) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null
          this.setupWebSocket()
        }, this.reconnectInterval)
      }
    },

    sendMessage(message) {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(message) // 发送消息到 WebSocket 服务器
      }
    },

    startHeartbeat() {
      this.stopHeartbeat()
      this.heartbeatInterval = setInterval(() => {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          this.websocket.send('ping')
        }
      }, 10000) // 每 10 秒发送一次心跳
    },

    stopHeartbeat() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval) // 停止心跳检测定时器
        this.heartbeatInterval = null
      }
      if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null }
    }
  }
}
</script>
<style lang="scss">@import "./notification.scss";</style>