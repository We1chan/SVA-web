import flvjs from 'flv.js'
import { createLiveFlvPlayer, isFlvUrl } from '@/utils/live-flv-player'
import { toBrowserPlayableUrl } from '@/utils/media-url'

jest.mock('flv.js', () => ({
  Events: { ERROR: 'error' },
  isSupported: jest.fn(() => true),
  createPlayer: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    attachMediaElement: jest.fn(),
    load: jest.fn(),
    play: jest.fn(() => Promise.resolve())
  }))
}))

jest.mock('@/utils/media-url', () => ({
  toBrowserPlayableUrl: jest.fn((url) => `http://localhost${url}`)
}))

describe('createLiveFlvPlayer', () => {
  it('plays relative HTTP-FLV with video-only live config', () => {
    const video = document.createElement('video')
    const player = createLiveFlvPlayer(video, '/live/cam2.live.flv')

    expect(isFlvUrl('/live/cam2.live.flv')).toBe(true)
    expect(toBrowserPlayableUrl).toHaveBeenCalledWith('/live/cam2.live.flv')
    expect(flvjs.createPlayer).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'flv',
        url: 'http://localhost/live/cam2.live.flv',
        isLive: true,
        hasAudio: false,
        hasVideo: true
      }),
      expect.objectContaining({
        enableStashBuffer: false
      })
    )
    expect(player).toBeTruthy()
    expect(player.attachMediaElement).toHaveBeenCalledWith(video)
    expect(player.load).toHaveBeenCalled()
    expect(player.play).toHaveBeenCalled()
  })
})
