import { toBrowserPlayableUrl } from '@/utils/media-url'

describe('toBrowserPlayableUrl', () => {
  const originalGbOrigin = process.env.VUE_APP_GB_MEDIA_PUBLIC_ORIGIN
  beforeEach(() => { delete process.env.VUE_APP_GB_MEDIA_PUBLIC_ORIGIN })
  afterEach(() => {
    if (originalGbOrigin === undefined) delete process.env.VUE_APP_GB_MEDIA_PUBLIC_ORIGIN
    else process.env.VUE_APP_GB_MEDIA_PUBLIC_ORIGIN = originalGbOrigin
  })
  const httpLocation = {
    href: 'http://localhost/device/manage',
    protocol: 'http:',
    host: 'localhost'
  }

  it('rewrites local ZLM websocket FLV to same-origin HTTP-FLV', () => {
    expect(toBrowserPlayableUrl('ws://127.0.0.1:9992/live/cam228703.live.flv', httpLocation))
      .toBe('http://localhost/live/cam228703.live.flv')
  })

  it('rewrites IPv6 loopback and preserves query parameters', () => {
    expect(toBrowserPlayableUrl('ws://[::1]:9992/live/cam228704.live.flv?token=1', httpLocation))
      .toBe('http://localhost/live/cam228704.live.flv?token=1')
  })

  it('expands relative HTTP-FLV paths so flv.js gets an absolute URL', () => {
    expect(toBrowserPlayableUrl('/live/cam2.live.flv', httpLocation))
      .toBe('http://localhost/live/cam2.live.flv')
  })

  it('routes loopback GB28181 ZLM streams through the nginx GB media proxy', () => {
    const stream = '44010200491320000006_44010200491320000016'
    expect(toBrowserPlayableUrl(`ws://127.0.0.1:9996/rtp/${stream}.live.flv?token=1`, httpLocation))
      .toBe(`http://localhost/gb-media/rtp/${stream}.live.flv?token=1`)
  })

  it('uses secure protocols on an HTTPS page', () => {
    const httpsLocation = { href: 'https://sva.local/', protocol: 'https:', host: 'sva.local' }
    expect(toBrowserPlayableUrl('http://127.0.0.1:9992/live/camera.live.flv', httpsLocation))
      .toBe('https://sva.local/live/camera.live.flv')
    expect(toBrowserPlayableUrl('ws://127.0.0.1:9992/live/camera.live.flv', httpsLocation))
      .toBe('https://sva.local/live/camera.live.flv')
  })

  it('proxies the explicitly configured advertised GB origin over same-origin HTTP', () => {
    process.env.VUE_APP_GB_MEDIA_PUBLIC_ORIGIN = 'http://192.0.2.20:9996'
    expect(toBrowserPlayableUrl('ws://192.0.2.20:9996/rtp/camera.live.flv?token=1', httpLocation))
      .toBe('http://localhost/gb-media/rtp/camera.live.flv?token=1')
    const httpsLocation = { href: 'https://sva.local:8443/', protocol: 'https:', host: 'sva.local:8443' }
    expect(toBrowserPlayableUrl('http://192.0.2.20:9996/rtp/camera.live.flv', httpsLocation))
      .toBe('https://sva.local:8443/gb-media/rtp/camera.live.flv')
  })

  it('does not redirect other hosts, ports or non-FLV media to the GB proxy', () => {
    process.env.VUE_APP_GB_MEDIA_PUBLIC_ORIGIN = 'http://192.0.2.20:9996'
    for (const url of ['ws://192.0.2.21:9996/rtp/camera.live.flv',
      'ws://192.0.2.20:9992/live/camera.live.flv', 'http://192.0.2.20:9996/index.m3u8']) {
      expect(toBrowserPlayableUrl(url, httpLocation)).toBe(url)
    }
  })

  it('ignores a malformed configured origin without breaking existing playback', () => {
    process.env.VUE_APP_GB_MEDIA_PUBLIC_ORIGIN = 'not-a-url'
    expect(toBrowserPlayableUrl('ws://127.0.0.1:9996/rtp/camera.live.flv', httpLocation))
      .toBe('http://localhost/gb-media/rtp/camera.live.flv')
    expect(toBrowserPlayableUrl('ws://192.0.2.20:9996/rtp/camera.live.flv', httpLocation))
      .toBe('ws://192.0.2.20:9996/rtp/camera.live.flv')
  })

  it('leaves non-ZLM and non-loopback URLs unchanged', () => {
    expect(toBrowserPlayableUrl('ws://media.example.com:9992/live/camera.live.flv', httpLocation))
      .toBe('ws://media.example.com:9992/live/camera.live.flv')
    expect(toBrowserPlayableUrl('rtsp://127.0.0.1:9994/live/camera', httpLocation))
      .toBe('rtsp://127.0.0.1:9994/live/camera')
  })

  it('proxies remote GB28181 FLV urls through the same-origin GB media route', () => {
    expect(toBrowserPlayableUrl('http://172.24.82.42:9996/rtp/camera.live.flv', httpLocation))
      .toBe('http://localhost/gb-media/rtp/camera.live.flv')
  })
})
