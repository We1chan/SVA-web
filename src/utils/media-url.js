/**
 * Convert ZLM loopback playback URLs into a same-origin URL the browser can
 * reach through the nginx /media proxy. Other media URLs are left untouched.
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
    if (!isZlmProtocol || !isLoopback || parsed.port !== '9992') {
      return value
    }

    const isWebSocket = parsed.protocol === 'ws:' || parsed.protocol === 'wss:'
    const protocol = isWebSocket
      ? (browserLocation.protocol === 'https:' ? 'wss:' : 'ws:')
      : (browserLocation.protocol === 'https:' ? 'https:' : 'http:')
    return `${protocol}//${browserLocation.host}/media${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch (error) {
    return value
  }
}
