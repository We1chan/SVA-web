/**
 * 告警页睡岗快捷筛选与展示适配单元测试（阶段 4）
 *
 * 断言点（对齐验收计划 2026-09-01-frontend-backend-acceptance.md 阶段 4）：
 * 1. 「睡岗快捷筛选」点击后把 alarm_type_name=睡岗告警 传给列表接口；
 * 2. 表格渲染「设备类型」列头；
 * 3. sleep_duty 行为类型格式化为「睡岗」标签；
 * 4. SLEEP_DUTY / 睡岗告警 行类型标签为 warning（高亮）。
 */
import { mount, createLocalVue } from '@vue/test-utils'
import ElementUI from 'element-ui'
import WarningIndex from '@/views/warning/index.vue'
import {
  getAlarmTypeFilterOptions,
  getTeamWaring,
  getWarningDetail,
  getWarningList,
  handleWarning
} from '@/api/warning'
import { getDeptList } from '@/api/system/kanban'

jest.mock('@/api/warning', () => ({
  getAlarmTypeFilterOptions: jest.fn(),
  getTeamWaring: jest.fn(),
  getWarningDetail: jest.fn(),
  getWarningList: jest.fn(),
  handleWarning: jest.fn()
}))

jest.mock('@/api/system/kanban', () => ({
  getDeptList: jest.fn()
}))

jest.mock('@/store', () => ({
  getters: { permissions: ['*:*:*'] }
}))

const localVue = createLocalVue()
localVue.use(ElementUI)
localVue.directive('hasPermi', {})
localVue.directive('hasRole', {})
// RuoYi 全局 mixin 提供的 resetForm/download（resetForm 重置 el-form 校验）
localVue.mixin({
  methods: {
    resetForm() {},
    parseTime(time) {
      return time || ''
    }
  }
})

function createWrapper() {
  const mocks = {
    $modal: {
      msgSuccess: jest.fn(),
      msgError: jest.fn(),
      confirm: jest.fn(() => Promise.resolve())
    },
    $message: {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn()
    },
    $router: { push: jest.fn() },
    $route: { query: {}, path: '/warning' },
    download: jest.fn()
  }
  const wrapper = mount(WarningIndex, {
    localVue,
    mocks,
    stubs: {
      player: { template: '<div class="player-stub" />' },
      Pagination: { template: '<div class="pagination-stub" />' }
    },
    attachTo: document.body
  })
  wrapper.vm.$modal = mocks.$modal
  wrapper.vm.$message = mocks.$message
  return wrapper
}

function flushAll() {
  return new Promise(resolve => setTimeout(resolve, 50))
}

describe('Warning 告警页睡岗适配', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getAlarmTypeFilterOptions.mockResolvedValue({
      data: [{ alarm_type_name: '停留告警' }]
    })
    getTeamWaring.mockResolvedValue({ data: [] })
    getDeptList.mockResolvedValue({ data: [] })
    getWarningList.mockResolvedValue({ rows: [], total: 0, token: '' })
  })

  it('渲染「睡岗快捷筛选」按钮与「设备类型」列头', async () => {
    const wrapper = createWrapper()
    await flushAll()
    const text = wrapper.text()
    expect(text).toContain('睡岗快捷筛选')
    expect(text).toContain('设备类型')
    wrapper.destroy()
  })

  it('点击睡岗快捷筛选：列表请求携带 alarm_type_name=睡岗告警', async () => {
    const wrapper = createWrapper()
    await flushAll()
    getWarningList.mockClear()
    wrapper.vm.applySleepDutyShortcut()
    await flushAll()
    expect(wrapper.vm.querySpecificParams.alarm_type_name).toBe('睡岗告警')
    expect(getWarningList).toHaveBeenLastCalledWith(
      expect.objectContaining({ alarm_type_name: '睡岗告警', pageNum: 1 })
    )
    // 快捷筛选激活态 computed
    expect(wrapper.vm.sleepDutyShortcutActive).toBe(true)
    wrapper.destroy()
  })

  it('sleep_duty 行为类型格式化为「睡岗」', () => {
    const wrapper = createWrapper()
    expect(wrapper.vm.getBehaviorTypeLabel('sleep_duty')).toBe('睡岗')
    expect(wrapper.vm.getBehaviorTypeLabel('dwell')).toBe('停留')
    wrapper.destroy()
  })

  it('SLEEP_DUTY / 睡岗告警 行渲染 warning 高亮类型标签', () => {
    const wrapper = createWrapper()
    expect(wrapper.vm.getAlarmTypeTagType({ alarm_type: 'SLEEP_DUTY' })).toBe('warning')
    expect(wrapper.vm.getAlarmTypeTagType({ alarm_type_name: '睡岗告警' })).toBe('warning')
    expect(wrapper.vm.getAlarmTypeTagType({ alarm_type_name: '停留告警' })).toBe('info')
    wrapper.destroy()
  })

  it('列表数据含 device_type 与 picture_absolute_url 时正常透传渲染', async () => {
    getWarningList.mockResolvedValue({ rows: [], total: 0, token: '' })
    const wrapper = createWrapper()
    await flushAll()
    getWarningList.mockResolvedValue({
      rows: [
        {
          w_id: 1,
          id: 'sleep-1',
          alarm_type: 'SLEEP_DUTY',
          alarm_type_name: '睡岗告警',
          device_id: 'dev-rtsp-1',
          device_name: '值班室摄像机',
          device_type: 'RTSP',
          sva_behavior_type: 'sleep_duty',
          picture_absolute_url: 'http://127.0.0.1:9114/alarm/sleep-1.jpg',
          alarm_time: '2026-09-01 10:00:00',
          is_handle: 0
        }
      ],
      total: 1,
      token: 'tok'
    })
    getWarningList.mockClear()
    await wrapper.vm.fetchData()
    expect(getWarningList).toHaveBeenCalled()
    expect(wrapper.vm.warningList.length).toBe(1)
    expect(wrapper.vm.warningList[0].device_type).toBe('RTSP')
    expect(wrapper.vm.warningList[0].alarm_type_name).toBe('睡岗告警')
    expect(wrapper.vm.warningList[0].picture_absolute_url).toContain('/alarm/sleep-1.jpg')
    expect(wrapper.vm.getAlarmTypeTagType(wrapper.vm.warningList[0])).toBe('warning')
    wrapper.destroy()
  })
})
