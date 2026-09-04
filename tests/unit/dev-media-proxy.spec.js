/** Development must proxy the same preview prefixes as production Nginx. */
describe('development media proxies', () => {
  const originalMedia = process.env.VUE_APP_MEDIA_URL
  const originalGbMedia = process.env.VUE_APP_GB_MEDIA_URL

  afterEach(() => {
    if (originalMedia === undefined) delete process.env.VUE_APP_MEDIA_URL
    else process.env.VUE_APP_MEDIA_URL = originalMedia
    if (originalGbMedia === undefined) delete process.env.VUE_APP_GB_MEDIA_URL
    else process.env.VUE_APP_GB_MEDIA_URL = originalGbMedia
    jest.resetModules()
  })

  it('preserves primary stream paths and strips only dedicated proxy prefixes', () => {
    delete process.env.VUE_APP_MEDIA_URL
    delete process.env.VUE_APP_GB_MEDIA_URL
    jest.resetModules()
    const proxy = require('../../vue.config').devServer.proxy
    for (const prefix of ['/live', '/analyzer', '/media']) {
      expect(proxy['^' + prefix + '(?:/|$)'].target).toBe('http://127.0.0.1:9992')
      expect(proxy['^' + prefix + '(?:/|$)'].ws).toBe(true)
    }
    expect(proxy['^/live(?:/|$)'].pathRewrite).toBeUndefined()
    expect(proxy['^/analyzer(?:/|$)'].pathRewrite).toBeUndefined()
    expect(proxy['^/media(?:/|$)'].pathRewrite).toEqual({ '^/media': '' })
    expect(proxy['^/gb-media(?:/|$)'].target).toBe('http://127.0.0.1:9996')
    expect(proxy['^/gb-media(?:/|$)'].pathRewrite).toEqual({ '^/gb-media': '' })
  })

  it('allows different media hosts without editing shared source', () => {
    process.env.VUE_APP_MEDIA_URL = 'http://192.0.2.10:9992'
    process.env.VUE_APP_GB_MEDIA_URL = 'http://192.0.2.20:9996'
    jest.resetModules()
    const proxy = require('../../vue.config').devServer.proxy
    expect(proxy['^/analyzer(?:/|$)'].target).toBe('http://192.0.2.10:9992')
    expect(proxy['^/gb-media(?:/|$)'].target).toBe('http://192.0.2.20:9996')
  })

  it('does not capture a nested stream path before its prefix can be stripped', () => {
    const config = require('../../vue.config').devServer.proxy
    const prepareProxy = require('@vue/cli-service/lib/util/prepareProxy')
    const proxies = prepareProxy(config, require('path').resolve(__dirname, '../../public'))
    for (const path of ['/media/live/camera.live.flv', '/media/analyzer/task.live.flv',
      '/gb-media/rtp/camera.live.flv', '/live/camera.live.flv', '/analyzer/task.live.flv']) {
      const matches = proxies.filter(proxy => proxy.context(path, { method: 'GET', headers: {} }))
      expect(matches).toHaveLength(1)
      if (path.startsWith('/media/')) expect(matches[0].pathRewrite).toEqual({ '^/media': '' })
    }
  })
})
