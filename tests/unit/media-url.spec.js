import { toBrowserPlayableUrl } from '@/utils/media-url'

describe('toBrowserPlayableUrl', () => {
  const httpLocation = {
    href: 'http://localhost/device/manage',
    protocol: 'http:',
    host: 'localhost'
  }

  it('rewrites local ZLM websocket FLV through the same-origin media proxy', () => {
    expect(toBrowserPlayableUrl('ws://127.0.0.1:9992/live/cam228703.live.flv', httpLocation))
      .toBe('ws://localhost/media/live/cam228703.live.flv')
  })

  it('rewrites IPv6 loopback and preserves query parameters', () => {
    expect(toBrowserPlayableUrl('ws://[::1]:9992/live/cam228704.live.flv?token=1', httpLocation))
      .toBe('ws://localhost/media/live/cam228704.live.flv?token=1')
  })

  it('uses secure protocols on an HTTPS page', () => {
    const httpsLocation = { href: 'https://sva.local/', protocol: 'https:', host: 'sva.local' }
    expect(toBrowserPlayableUrl('http://127.0.0.1:9992/live/camera.live.flv', httpsLocation))
      .toBe('https://sva.local/media/live/camera.live.flv')
    expect(toBrowserPlayableUrl('ws://127.0.0.1:9992/live/camera.live.flv', httpsLocation))
      .toBe('wss://sva.local/media/live/camera.live.flv')
  })

  it('leaves non-ZLM and non-loopback URLs unchanged', () => {
    expect(toBrowserPlayableUrl('ws://media.example.com:9992/live/camera.live.flv', httpLocation))
      .toBe('ws://media.example.com:9992/live/camera.live.flv')
    expect(toBrowserPlayableUrl('rtsp://127.0.0.1:9994/live/camera', httpLocation))
      .toBe('rtsp://127.0.0.1:9994/live/camera')
  })
})
