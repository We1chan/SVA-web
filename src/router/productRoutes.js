// Retired front-end modules may still be returned by older menu databases.
// Remove them before resolving components, so neither links nor direct routes
// can load a deleted view. Server authorization remains owned by the backend.
const retiredModules = ['tool', 'person', 'huazhi', 'shipin', 'dashboard', 'monitor/cache', 'monitor/druid']
const retiredViews = new Set(['warning/test', 'deployment/test', 'index_v1', 'dping/setting', 'register'])
const retiredPaths = new Set(['/tool', '/handle', '/person', '/huazhi', '/shipin', '/register'])
const containers = new Set(['Layout', 'ParentView'])

function normalizeView(view) {
  return typeof view === 'string' ? view.replace(/^\/+|\.vue$/g, '') : ''
}

export function pruneProductRoutes(routes) {
  return (routes || []).reduce((result, source) => {
    const view = normalizeView(source.component)
    if (retiredPaths.has(source.path) || retiredViews.has(view) ||
      retiredModules.some(prefix => view === prefix || view.startsWith(prefix + '/'))) return result

    const route = { ...source }
    if (Array.isArray(source.children)) {
      route.children = pruneProductRoutes(source.children)
      if (!route.children.length) return result
      if (containers.has(view) && route.children.length === 1) route.alwaysShow = false
    }
    result.push(route)
    return result
  }, [])
}

// Keep everyday operations ahead of administration without adding permissions.
export function orderProductRoutes(routes) {
  const order = ['/device', '/deployment', '/warning', '/type', '/monitor', '/system']
  return routes.map((route, index) => ({ route, index })).sort((a, b) => {
    const rank = path => order.includes(path) ? order.indexOf(path) : order.length
    return rank(a.route.path) - rank(b.route.path) || a.index - b.index
  }).map(({ route }) => route)
}
