/**
 * 首页驾驶舱（src/views/home/index.vue）单元测试（阶段 3）
 *
 * 覆盖：
 * 1. 有权限时渲染页标题与组织筛选；无权限时不渲染筛选。
 * 2. 公示行携带正确 id（w_id），点击行后 $router.push 的 query.wid === 该行 w_id。
 * 3. getHandleData 返回空数组时渲染“暂无挂牌公示”。
 * 4. getHandleData rejected 时渲染错误态，点击重试后再次调用 getHandleData。
 * 5. 乱序响应：后发的请求先返回，最终展示最新响应（陈旧响应被忽略）。
 * 6. 组织列表失败不阻塞公示渲染。
 */
import { mount, createLocalVue } from '@vue/test-utils'
import ElementUI from 'element-ui'
import HomeIndex from '@/views/home/index.vue'

// kanban 全部导出为 jest.fn，重点使用 getHandleData / getDeptList
jest.mock('@/api/system/kanban', () => ({
  getMonthWaring: jest.fn(),
  getMonthMajorWaring: jest.fn(),
  getMonthOverdueWaring: jest.fn(),
  getMonthHandle: jest.fn(),
  getRanking: jest.fn(),
  getTrend: jest.fn(),
  getGrowth: jest.fn(),
  getColumn: jest.fn(),
  getLevelSpread: jest.fn(),
  getTypeSpread: jest.fn(),
  getHandleData: jest.fn(),
  getDeptList: jest.fn(),
  getDeviceNum: jest.fn(),
  getAlarmPhoto: jest.fn(),
  getRealAlarm: jest.fn()
}))

// 可变 store mock：用惰性 getter 读取全局变量，避免 jest 提升期 TDZ 问题
global.__HOME_PERMS__ = ['*:*:*']
jest.mock('@/store', () => ({
  getters: {
    get permissions() {
      return global.__HOME_PERMS__
    }
  }
}))

// @opentiny/vue 全部导出为 stub 组件（用 render 函数，避免 jsdom 运行时无编译器的告警）
jest.mock('@opentiny/vue', () => {
  const stub = (name, cls) => ({ name, render: h => h('div', { class: cls }) })
  return {
    Grid: stub('TinyGrid', 'tiny-grid-stub'),
    GridColumn: stub('TinyGridColumn', 'tiny-grid-column-stub'),
    Layout: stub('TinyLayout', 'tiny-layout-stub'),
    Row: stub('TinyRow', 'tiny-row-stub'),
    Col: stub('TinyCol', 'tiny-col-stub'),
    Progress: stub('TinyProgress', 'tiny-progress-stub')
  }
})

// echarts 在单测中以安全 stub 替代
jest.mock('echarts', () => ({
  init: jest.fn(() => ({ resize: jest.fn(), dispose: jest.fn(), isDisposed: () => false, setOption: jest.fn(), on: jest.fn() })),
  getInstanceByDom: jest.fn(() => null)
}))

import {
  getDeptList,
  getHandleData
} from '@/api/system/kanban'

const localVue = createLocalVue()
localVue.use(ElementUI)

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function flushAll() {
  return new Promise(resolve => setTimeout(resolve, 50))
}

function createWrapper() {
  const mocks = {
    $router: { push: jest.fn() },
    $route: { query: {}, path: '/home' }
  }
    const wrapper = mount(HomeIndex, {
      localVue,
      mocks,
      stubs: {
        hazardcount: true,
        hazardtrend: true,
        hazarddistribution: true
      },
      attachTo: document.body
    })
    return wrapper
  }

function makeRow(wid = 'W1') {
  return {
    w_id: wid,
    alarm_type_name: `事件-${wid}`,
    device_name: `位置-${wid}`,
    h_org_name: `处置-${wid}`
  }
}

describe('首页驾驶舱', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.__HOME_PERMS__ = ['*:*:*']
    getDeptList.mockResolvedValue({ data: [{ orgIndex: '1', deptName: '组织A' }] })
    getHandleData.mockResolvedValue({ data: [] })
  })

  it('有权限时渲染页标题与组织筛选', async () => {
    const wrapper = createWrapper()
    await flushAll()
    expect(wrapper.text()).toContain('安全运营驾驶舱')
    expect(wrapper.find('.home-org-select').exists()).toBe(true)
    wrapper.destroy()
  })

  it('无权限（permissions=[]）时不渲染组织筛选', async () => {
    global.__HOME_PERMS__ = []
    const wrapper = createWrapper()
    await flushAll()
    expect(wrapper.find('.home-org-select').exists()).toBe(false)
    wrapper.destroy()
  })

  it('公示行携带正确 id（w_id），点击行后跳转 query.wid 等于该行 w_id', async () => {
    getHandleData.mockResolvedValue({ data: [makeRow('W100'), makeRow('W200')] })
    const wrapper = createWrapper()
    await flushAll()
    expect(wrapper.vm.handleData[0].id).toBe('W100')
    expect(wrapper.vm.handleData[1].id).toBe('W200')

    wrapper.vm.handleClick(wrapper.vm.handleData[1])
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith({
      path: '/warning/warning',
      query: { withQue: 7, wid: 'W200' }
    })
    wrapper.destroy()
  })

  it('getHandleData 返回空数组时渲染“暂无挂牌公示”', async () => {
    getHandleData.mockResolvedValue({ data: [] })
    const wrapper = createWrapper()
    await flushAll()
    expect(wrapper.text()).toContain('暂无挂牌公示')
    wrapper.destroy()
  })

  it('getHandleData 失败时渲染错误态，点击重试后再次调用', async () => {
    getHandleData.mockRejectedValueOnce(new Error('fail'))
    const wrapper = createWrapper()
    await flushAll()
    expect(wrapper.text()).toContain('公示加载失败')
    expect(wrapper.vm.error).toBe(true)

    getHandleData.mockResolvedValue({ data: [] })
    await wrapper.find('.home-retry').trigger('click')
    await flushAll()
    // 初次失败 1 次 + 重试 1 次
    expect(getHandleData).toHaveBeenCalledTimes(2)
    wrapper.destroy()
  })

  it('乱序响应：后发请求先返回，最终展示最新响应（陈旧响应被忽略）', async () => {
    getHandleData.mockResolvedValue({ data: [] }) // 初始 mount 调用
    const wrapper = createWrapper()
    await flushAll()

    const pA = deferred()
    const pB = deferred()
    getHandleData.mockReturnValueOnce(pA.promise).mockReturnValueOnce(pB.promise)

    wrapper.vm.loadHandle('') // token -> 2，等待 A
    wrapper.vm.loadHandle('') // token -> 3，等待 B

    // 让后发的 B 先返回
    pB.resolve({ data: [makeRow('B')] })
    await flushAll()
    // 此时 A 尚未返回，最新响应应为 B
    expect(wrapper.vm.handleData.map(r => r.id)).toEqual(['B'])

    // A 后返回，应被忽略
    pA.resolve({ data: [makeRow('A')] })
    await flushAll()
    expect(wrapper.vm.handleData.map(r => r.id)).toEqual(['B'])
    wrapper.destroy()
  })

  it('组织列表失败不阻塞公示渲染', async () => {
    global.__HOME_PERMS__ = ['*:*:*']
    getDeptList.mockRejectedValue(new Error('dept fail'))
    getHandleData.mockResolvedValue({ data: [makeRow('W1')] })
    const wrapper = createWrapper()
    await flushAll()
    // 公示仍渲染
    expect(wrapper.vm.handleData.map(r => r.id)).toEqual(['W1'])
    // 组织筛选仍渲染（仅保留“全部”）
    expect(wrapper.find('.home-org-select').exists()).toBe(true)
    expect(wrapper.vm.orgOptions).toEqual([{ value: '', label: '全部' }])
    wrapper.destroy()
  })
})
