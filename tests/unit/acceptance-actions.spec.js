import WarningIndex from '@/views/warning/index.vue'
import FalseAlarms from '@/views/warning/wubao.vue'
import Recondition from '@/views/warning/recondition.vue'
import DeviceHistory from '@/views/device/components/device-warning.vue'
import DeviceManage from '@/views/device/manage.vue'
import OfflineDevices from '@/views/device/lixian.vue'
import EventOrchestration from '@/views/deployment/eventOrchestration.vue'
import { getWarningList, getWubao, getRecondition } from '@/api/warning'
import { getHistoryWaring, syncGb28181Devices, refreshGb28181Status } from '@/api/device'
import { listDeploymentEventOrchestrations, createDeploymentEventOrchestration } from '@/api/deploymentEventOrchestration'

jest.mock('@/api/warning', () => ({
  getWarningList: jest.fn(), getWubao: jest.fn(), getRecondition: jest.fn()
}))
jest.mock('@/api/device', () => ({
  getHistoryWaring: jest.fn(), syncGb28181Devices: jest.fn(), refreshGb28181Status: jest.fn()
}))
jest.mock('@/api/deploymentEventOrchestration', () => ({
  listDeploymentEventOrchestrations: jest.fn(), createDeploymentEventOrchestration: jest.fn()
}))
jest.mock('@/store', () => ({ getters: { permissions: ['*:*:*'] } }))

function context(component) {
  const vm = {
    $route: { query: {} }, $refs: {}, $nextTick: fn => fn(),
    $message: { error: jest.fn(), warning: jest.fn(), success: jest.fn() },
    $modal: { msgError: jest.fn(), msgSuccess: jest.fn() },
    download: jest.fn()
  }
  Object.entries(component.methods).forEach(([name, method]) => { vm[name] = method.bind(vm) })
  Object.assign(vm, component.data.call(vm))
  return vm
}

describe('验收按钮回归', () => {
  beforeEach(() => jest.clearAllMocks())

  it.each([[WarningIndex, undefined], [FalseAlarms, 'falseAlarm'], [Recondition, 'recondition']])(
    '告警导出保持页面全部筛选并去掉分页', (component, exportScope) => {
      const vm = context(component)
      vm.dateRange = ['2026-09-01', '2026-09-03']
      vm.querySpecificParams = { alarm_type_name: '睡岗告警', device_name: '值班室', is_handle: '0' }
      vm.handleExport()
      const params = vm.download.mock.calls[0][1]
      expect(params).toMatchObject(vm.querySpecificParams)
      expect(params.begin).toBeGreaterThan(0)
      expect(params.pageNum).toBeUndefined()
      expect(params.pageSize).toBeUndefined()
      if (exportScope) expect(params.exportScope).toBe(exportScope)
    }
  )

  it.each([[WarningIndex, getWarningList], [FalseAlarms, getWubao], [Recondition, getRecondition], [DeviceHistory, getHistoryWaring]])(
    '告警查询失败后结束加载并显示错误', async (component, api) => {
      api.mockRejectedValueOnce(new Error('服务不可达'))
      const vm = context(component)
      await vm.fetchData()
      expect(vm.loading).toBe(false)
      expect(vm.$modal.msgError).toHaveBeenCalledWith(expect.stringContaining('服务不可达'))
    }
  )

  it.each([WarningIndex, FalseAlarms])('首页月度钻取包括 1 日且不包含下月', component => {
    const vm = context(component)
    vm.fetchData = jest.fn()
    vm.$route.query = { withQue: '8', time: '月' }
    vm.solveRouterQuery()
    const today = new Date()
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    expect(vm.dateRange[0].slice(-2)).toBe('01')
    expect(Number(vm.dateRange[1].slice(-2))).toBe(lastDay)
    expect(vm.dateRange[1].slice(0, 7)).toBe(vm.dateRange[0].slice(0, 7))
  })

  it('SLEEP_DUTY 标准大写事件展示为睡岗', () => {
    expect(context(WarningIndex).getBehaviorTypeLabel('SLEEP_DUTY')).toBe('睡岗')
  })

  it('国标编辑不回传平台维护的身份、媒体和在线状态', () => {
    const vm = context(DeviceManage)
    vm.isEdit = true
    vm.form = { ape_id: 'gb-1', device_type: 'GB28181', name: '门口', direct_source_url: 'rtsp://old', gb_device_id: '1', gb_channel_id: '2', gb_platform_id: '3', play_url: 'http://stream', is_online: '1', monitor_status: 'STOPPED', stream_source_type: 'GB28181' }
    const payload = vm.buildSubmitPayload()
    expect(payload).toMatchObject({ ape_id: 'gb-1', name: '门口' })
    ;['gb_device_id', 'gb_channel_id', 'gb_platform_id', 'play_url', 'is_online', 'monitor_status', 'direct_source_url'].forEach(key => expect(payload[key]).toBeUndefined())
  })

  it('国标新增保留手工填写的身份，但不提交 RTSP 直连地址', () => {
    const vm = context(DeviceManage)
    vm.isEdit = false
    vm.form = { device_type: 'GB28181', gb_device_id: 'device-1', gb_channel_id: 'channel-1', direct_source_url: 'rtsp://old' }
    const payload = vm.buildSubmitPayload()
    expect(payload).toMatchObject({ gb_device_id: 'device-1', gb_channel_id: 'channel-1' })
    expect(payload.direct_source_url).toBeUndefined()
  })

  it('状态刷新同时拉取 WVP 在线状态和目录绑定的媒体状态', async () => {
    const vm = context(DeviceManage)
    vm.getList = jest.fn()
    syncGb28181Devices.mockResolvedValue({ data: { channelCount: 2, onlineChannelCount: 1, offlineChannelCount: 1 } })
    refreshGb28181Status.mockResolvedValue({ data: { available: 1, unavailable: 0 } })
    expect(typeof vm.handleRefreshGb28181).toBe('function')
    await vm.handleRefreshGb28181()
    expect(syncGb28181Devices).toHaveBeenCalled()
    expect(refreshGb28181Status).toHaveBeenCalledWith(1)
    expect(vm.getList).toHaveBeenCalled()
    expect(vm.refreshing).toBe(false)
  })

  it('离线设备导出保持离线范围', () => {
    const vm = context(OfflineDevices)
    vm.handleExport()
    expect(vm.download.mock.calls[0][1]).toMatchObject({ is_online: 2 })
  })

  it('事件编排列表断网后再次刷新会重试后端', async () => {
    const vm = context(EventOrchestration)
    vm.deploymentId = 'task-1'
    listDeploymentEventOrchestrations.mockRejectedValueOnce(new Error('连接失败'))
      .mockResolvedValueOnce({ data: [{ id: 'saved-rule', name: '睡岗复核' }] })
    await vm.loadOrchestrations()
    await vm.loadOrchestrations()
    expect(listDeploymentEventOrchestrations).toHaveBeenCalledTimes(2)
    expect(vm.orchestrationList[0].id).toBe('saved-rule')
  })

  it('事件编排在后端失败时不冒充保存成功', async () => {
    const vm = context(EventOrchestration)
    vm.deploymentId = 'task-1'
    vm.orchestrationApiAvailable = false
    vm.eventPool = [{ eventKey: 'sleep' }, { eventKey: 'person' }]
    vm.editForm = { name: '睡岗复核', outputAlarmName: '睡岗告警', conditionKeys: ['sleep', 'person'] }
    vm.$refs.editForm = { validate: fn => fn(true) }
    vm.dialogVisible = true
    createDeploymentEventOrchestration.mockRejectedValueOnce(new Error('保存失败'))
    await vm.handleSave()
    expect(createDeploymentEventOrchestration).toHaveBeenCalled()
    expect(vm.$message.success).not.toHaveBeenCalled()
    expect(vm.$message.error).toHaveBeenCalled()
    expect(vm.dialogVisible).toBe(true)
    expect(vm.saveLoading).toBe(false)
  })
})
