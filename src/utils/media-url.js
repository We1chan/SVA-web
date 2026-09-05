/**
 * Convert ZLM loopback playback URLs into a same-origin URL the browser can
 * reach through the site's HTTP-FLV proxies. An explicitly configured GB media
 * origin also supports WVP advertising a LAN address that browsers cannot reach.
 * Other remote media servers must retain their own URLs.
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
    const isKnownGbOrigin = matchesGbMediaOrigin(parsed, process.env.VUE_APP_GB_MEDIA_PUBLIC_ORIGIN)
    const isProxiedGbZlm = isZlmProtocol && isFlvPath(parsed.pathname) &&
      ((isLoopback && parsed.port === '9996') || isKnownGbOrigin)

    // GB28181 uses a dedicated ZLM instance. WSL does not reliably expose its
    // 9996 port to the Windows browser, so keep playback on nginx's public
    // origin and preserve the original /rtp/... path behind /gb-media/.
    if (isProxiedGbZlm) {
      return `${pageProtocol}//${browserLocation.host}/gb-media${parsed.pathname}${parsed.search}${parsed.hash}`
    }

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

// GB28181's dedicated ZLM is exposed through nginx on port 9996. WVP may
// advertise its private address, which is not reachable from the browser.
function matchesGbMediaOrigin(parsed, configuredOrigin) {
  if (!configuredOrigin) {
    return parsed.port === '9996' && /^\/rtp\//i.test(parsed.pathname)
  }
  try {
    const expected = new URL(configuredOrigin)
    const httpOrigin = url => url.origin.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:')
    return ['http:', 'https:', 'ws:', 'wss:'].includes(expected.protocol) &&
      httpOrigin(parsed) === httpOrigin(expected)
  } catch (error) {
    return false
  }
}

function isFlvPath(pathname) {
  return /\.flv$/i.test(String(pathname || ''))
}
