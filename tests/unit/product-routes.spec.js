import { pruneProductRoutes, orderProductRoutes } from '@/router/productRoutes'

describe('product route pruning', () => {
  it('removes retired routes before component loading, including nested legacy menus', () => {
    const routes = [
      { path: '/tool', component: 'Layout', children: [{ path: 'gen', component: 'tool/gen/index' }] },
      { path: '/handle', component: 'Layout', children: [{ path: 'handle', component: 'warning/test' }] },
      { path: '/legacy', component: 'Layout', children: [{ path: 'nested', component: 'ParentView', children: [{ path: 'old', component: '/person/index.vue' }] }] },
      { path: '/monitor', component: 'Layout', children: [
        { path: 'cache', component: 'monitor/cache/list' },
        { path: 'druid', component: 'monitor/druid/index' },
        { path: 'algorithm', component: 'monitor/algorithm/index', permissions: ['monitor:algorithm:list'] }
      ] }
    ]
    const original = JSON.stringify(routes)
    const filtered = pruneProductRoutes(routes)
    expect(filtered.map(route => route.path)).toEqual(['/monitor'])
    expect(filtered[0].children).toEqual([routes[3].children[2]])
    expect(JSON.stringify(routes)).toBe(original)
  })

  it('preserves core functions, metadata and permissions, and allows unrelated extensions', () => {
    const routes = ['device/manage', 'device/realtime', 'deployment/index', 'warning/index', 'warning/type', 'system/user/index', 'monitor/server/index', 'monitor/job/index', 'partner/toolbox'].map(component => ({
      component, path: component, meta: { title: component }, permissions: ['existing:permission']
    }))
    expect(pruneProductRoutes(routes)).toEqual(routes)
    expect(pruneProductRoutes(undefined)).toEqual([])
  })

  it('keeps business menus first without mutating or creating routes', () => {
    const routes = [{ path: '/system' }, { path: '/monitor' }, { path: '/warning' }, { path: '/device' }]
    expect(orderProductRoutes(routes).map(route => route.path)).toEqual(['/device', '/warning', '/monitor', '/system'])
    expect(routes[0].path).toBe('/system')
  })
})
