/**
 * Convert ZLM loopback playback URLs into a same-origin URL the browser can
 * reach through nginx `/live/` (HTTP-FLV). Relative `/live/*.flv` paths are
 * expanded so flv.js receives an absolute http(s) URL.
 */
export function toBrowserPlayableUrl(url, locationLike) {
  const value = String(url || '').trim()
  if (!value) {
    return value
  }

  const browserLocation = locationLike || (typeof window !== 'undefined' ? window.location : null)
  if (!browserLocation) {
    return value
  }

  try {
    const parsed = new URL(value, browserLocation.href)
    const isZlmProtocol = ['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol)
    const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
    const pageProtocol = browserLocation.protocol === 'https:' ? 'https:' : 'http:'

    const isLivePath = parsed.pathname.startsWith('/live/')
    const isRelativeLive = value.startsWith('/') && isLivePath
    const isLoopbackZlm = isZlmProtocol && isLoopback && (parsed.port === '9992' || isLivePath)

    // nginx only proxies HTTP-FLV on /live/. Convert local ZLM and relative
    // /live paths to same-origin HTTP so flv.js can play them.
    if (isRelativeLive || isLoopbackZlm) {
      return `${pageProtocol}//${browserLocation.host}${parsed.pathname}${parsed.search}${parsed.hash}`
    }

    return value
  } catch (error) {
    return value
  }
}
