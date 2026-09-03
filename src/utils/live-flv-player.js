import flvjs from 'flv.js'
import { toBrowserPlayableUrl } from '@/utils/media-url'

export function isFlvUrl(url) {
  return /\.flv($|[?#])/i.test(String(url || ''))
}

export function createLiveFlvPlayer(videoElement, url, handlers = {}) {
  const playableUrl = toBrowserPlayableUrl(url)
  if (!videoElement || !playableUrl || !isFlvUrl(playableUrl) || !flvjs.isSupported()) {
    return null
  }

  const player = flvjs.createPlayer({
    type: 'flv',
    url: playableUrl,
    isLive: true,
    hasAudio: false,
    hasVideo: true,
    cors: true
  }, {
    enableWorker: false,
    enableStashBuffer: false,
    stashInitialSize: 128,
    autoCleanupSourceBuffer: true,
    fixAudioTimestampGap: false
  })

  const onPlaying = () => {
    if (typeof handlers.onPlaying === 'function') {
      handlers.onPlaying(playableUrl)
    }
  }
  const onError = (errorType, errorDetail, errorInfo) => {
    if (typeof handlers.onError === 'function') {
      handlers.onError({ errorType, errorDetail, errorInfo, playableUrl })
    }
  }

  player.on(flvjs.Events.ERROR, onError)
  videoElement.addEventListener('playing', onPlaying)
  videoElement.addEventListener('loadeddata', onPlaying)
  videoElement.muted = true
  player.attachMediaElement(videoElement)
  player.load()
  const playPromise = player.play()
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {})
  }

  player.__svaPlayableUrl = playableUrl
  player.__svaCleanup = () => {
    videoElement.removeEventListener('playing', onPlaying)
    videoElement.removeEventListener('loadeddata', onPlaying)
    try {
      player.off(flvjs.Events.ERROR, onError)
    } catch (error) {
      // Ignore teardown errors from already-destroyed players.
    }
  }
  return player
}

export function destroyLiveFlvPlayer(player, videoElement) {
  if (player && typeof player.__svaCleanup === 'function') {
    player.__svaCleanup()
  }
  if (player) {
    try {
      player.pause()
      player.unload()
      player.detachMediaElement()
      player.destroy()
    } catch (error) {
      // Ignore teardown errors to avoid blocking later stream recovery.
    }
  }
  if (videoElement) {
    try {
      videoElement.pause()
      videoElement.removeAttribute('src')
      videoElement.load()
    } catch (error) {
      // Ignore video element reset errors.
    }
  }
}
