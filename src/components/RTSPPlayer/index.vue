<template>
  <el-card :class="['box-card', { 'box-card--inline': inline, 'box-card--controls': $slots.controls, 'box-card--expanded': expanded }]" :style="cardStyle">
    <div slot="header" class="clearfix">
      <span> {{ title }} </span>
      <el-button style="float: right; padding: 3px 0" type="text" @click="closeProof">关闭</el-button>
    </div>
    <el-row>
      <el-col>
        <div class="grid-content bg-purple">
          <div class="block video-viewport" style="margin-top: 25px;">
            <video id="flv-1" ref="flvVideo" height="500" muted controls loop :style="viewportStyle" />
          </div>
        </div>
      </el-col>
    </el-row>
    <div v-if="$slots.controls" class="player-controls">
      <slot name="controls" />
    </div>
  </el-card>
</template>

<script>
import flvjs from 'flv.js'
import { toBrowserPlayableUrl } from '@/utils/media-url'
import { createLiveFlvPlayer, destroyLiveFlvPlayer } from '@/utils/live-flv-player'

export default {
  name: 'Player',
  props: {
    rtspUrl: {
      required: true,
      type: String
    },
    viewProof: {
      required: true,
      type: Boolean
    },
    title: {
      required: true,
      type: String
    },
    inline: {
      type: Boolean,
      default: false
    },
    expanded: {
      type: Boolean,
      default: false
    },
    viewportZoom: {
      type: Number,
      default: 1
    },
    viewportX: {
      type: Number,
      default: 0
    },
    viewportY: {
      type: Number,
      default: 0
    }
  },

  data() {
    return {
      flvPlayer: null,
      playerInitPending: false
    }
  },

  computed: {
    cardStyle() {
      return this.inline ? {} : { zIndex: 1000 }
    },
    viewportStyle() {
      const zoom = Math.max(1, Number(this.viewportZoom) || 1)
      // X/Y represent the virtual window's direction. Moving the window right
      // means translating the enlarged source left underneath it.
      const maxTranslate = (zoom - 1) * 50
      const round = value => Math.round(value * 1000) / 1000
      const x = round(-Math.max(-1, Math.min(1, Number(this.viewportX) || 0)) * maxTranslate)
      const y = round(-Math.max(-1, Math.min(1, Number(this.viewportY) || 0)) * maxTranslate)
      return {
        transform: `translate(${x}%, ${y}%) scale(${zoom})`
      }
    }
  },
  watch: {
    rtspUrl() {
      if (this.viewProof) this.schedulePlayerInit()
    },

    // Each preview session needs fresh media state, including reopening the
    // same URL after a source restart or decoder error.
    viewProof(visible) {
      if (visible) this.schedulePlayerInit()
      else this.closeFLVPlayer(true)
    }
  },

  mounted() {
    if (this.viewProof) this.schedulePlayerInit()
  },

  beforeDestroy() {
    this.closeFLVPlayer(true)
  },

  methods: {
    schedulePlayerInit() {
      // URL and visibility often change in one render. Coalesce their watchers
      // so two FLV players cannot attach competing buffers to the same video.
      if (this.playerInitPending) return
      this.playerInitPending = true
      this.$nextTick(() => {
        this.playerInitPending = false
        if (!this._isDestroyed && this.viewProof && this.rtspUrl) this.initFLVPlayer()
      })
    },
    isRtspUrl(url) {
      return /^rtsp:\/\//i.test(url || '')
    },

    isHttpMediaUrl(url) {
      return /^(https?:\/\/|wss?:\/\/|\/)/i.test(url || '')
    },

    isFlvUrl(url) {
      return /\.flv($|[?#])/i.test(url || '')
    },

    playHttpMedia(url) {
      const videoElement = this.$refs.flvVideo
      if (!videoElement || !url) return
      if (this.flvPlayer != null) this.closeFLVPlayer(true)
      videoElement.src = url
      videoElement.muted = false
      videoElement.play().catch(() => {
      })
    },

    playFlvMedia(url) {
      const videoElement = this.$refs.flvVideo
      if (!videoElement || !url) return
      if (this.flvPlayer != null) this.closeFLVPlayer(true)

      if (flvjs.isSupported()) {
        this.flvPlayer = createLiveFlvPlayer(videoElement, url)
      }
    },

    initFLVPlayer() {
      const videoElement = this.$refs.flvVideo
      if (!videoElement || !this.rtspUrl) return
      const playableUrl = toBrowserPlayableUrl(this.rtspUrl)

      if (this.isHttpMediaUrl(playableUrl) && this.isFlvUrl(playableUrl)) {
        this.playFlvMedia(playableUrl)
        return
      }

      if (/^(https?:\/\/|\/)/i.test(playableUrl)) {
        this.playHttpMedia(playableUrl)
        return
      }

      if (!this.isRtspUrl(playableUrl)) {
        if (this.flvPlayer != null) this.closeFLVPlayer(true)
        return
      }

      if (this.flvPlayer != null) this.closeFLVPlayer(true)
      this.$message.warning('未获取到浏览器可播放的视频地址，请刷新设备状态后重试')
    },

    closeFLVPlayer(realClose) {
      const videoElement = this.$refs.flvVideo
      if (realClose === true) {
        destroyLiveFlvPlayer(this.flvPlayer, videoElement)
        this.flvPlayer = null
        return
      }
      if (this.flvPlayer != null) {
        this.flvPlayer.pause()
      }
      if (videoElement) {
        videoElement.pause()
      }
    },

    closeProof() {
      this.closeFLVPlayer(true)
      this.$emit('closeProof')
    }

  }
}
</script>

<style lang="scss" scoped>
.text {
  font-size: 14px;
}

.item {
  margin-bottom: 18px;
}

.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}

.clearfix:after {
  clear: both
}

.box-card {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  width: 1030px;
  max-width: calc(100vw - 40px);
  height: 620px;
  z-index: 1000;
}

.box-card--inline {
  position: static;
  top: auto;
  left: auto;
  transform: none;
  width: 100%;
  height: auto;
}

.box-card--inline ::v-deep video {
  width: 100%;
  height: 320px;
}

.player-controls {
  padding: 10px 18px 2px;
  border-top: 1px solid #ebeef5;
}

.video-viewport {
  overflow: hidden;
  background: #000;
}

.video-viewport ::v-deep video {
  display: block;
  width: 100%;
  object-fit: contain;
  transform-origin: center center;
  transition: transform 100ms linear;
  background: #000;
}

.box-card--controls {
  height: auto;
  min-height: 620px;
}

.box-card--expanded {
  width: 1160px;
  min-height: 690px;
}

.box-card--expanded ::v-deep video {
  width: 100%;
  height: 530px;
  object-fit: contain;
  background: #000;
}
</style>
