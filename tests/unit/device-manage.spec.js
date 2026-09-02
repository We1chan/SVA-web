/**
 * 设备管理页 GB28181 适配单元测试（阶段 3）
 *
 * 断言点（对齐验收计划 2026-09-01-frontend-backend-acceptance.md 阶段 3）：
 * 1. 设备管理页渲染「接入类型」列与「同步国标设备」按钮；
 * 2. 接入类型筛选把 device_type=GB28181 传给列表接口；
 * 3. 「同步国标设备」调用 syncGb28181Devices(1) 并按返回统计提示后刷新列表；
 * 4. GB28181 编辑只读展示国标信息、且提交 payload 不携带 direct_source_url；
 * 5. RTSP 新增默认接入类型为 RTSP，格式化标签正确。
 */
import { mount, createLocalVue } from '@vue/test-utils'
import ElementUI from 'element-ui'
import DeviceManage from '@/views/device/manage.vue'
import {
  getDeviceList,
  getDevice,
  addDevice,
  updateDevice,
  syncGb28181Devices
} from '@/api/device'

jest.mock('@/api/device', () => ({
  getDeviceList: jest.fn().mockResolvedValue({ rows: [], total: 0 }),
  getDevice: jest.fn(),
  addDevice: jest.fn(),
  updateDevice: jest.fn(),
  delDevice: jest.fn(),
  startDeviceMonitor: jest.fn(),
  stopDeviceMonitor: jest.fn(),
  previewDeviceMonitor: jest.fn(),
  syncGb28181Devices: jest.fn().mockResolvedValue({ data: { created: 2, updated: 1, offlineMarked: 0 } }),
  refreshGb28181Status: jest.fn()
}))

jest.mock('@/api/system/user', () => ({
  deptTreeSelect: jest.fn().mockResolvedValue({ data: [] })
}))

const localVue = createLocalVue()
localVue.use(ElementUI)
localVue.directive('hasPermi', {})
// RuoYi 全局 mixin 提供的 resetForm（重置 el-form 校验），测试中 noop 即可
localVue.mixin({
  methods: {
    resetForm() {}
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
    $route: { query: {} }
  }
  const wrapper = mount(DeviceManage, {
    localVue,
    mocks,
    stubs: {
      player: { template: '<div class="player-stub" />' },
      devicewarning: { template: '<div class="devicewarning-stub" />' },
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

describe('DeviceManage GB28181 适配', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getDeviceList.mockResolvedValue({ rows: [], total: 0 })
    syncGb28181Devices.mockResolvedValue({ data: { created: 2, updated: 1, offlineMarked: 0 } })
  })

  it('渲染「接入类型」筛选与列、「同步国标设备」按钮', async () => {
    const wrapper = createWrapper()
    await flushAll()
    const text = wrapper.text()
    expect(text).toContain('接入类型')
    expect(text).toContain('同步国标设备')
    expect(wrapper.vm.queryParams).toHaveProperty('device_type')
    wrapper.destroy()
  })

  it('接入类型筛选为 GB28181 时，列表请求携带 device_type=GB28181', async () => {
    const wrapper = createWrapper()
    await flushAll()
    getDeviceList.mockClear()
    wrapper.vm.queryParams.device_type = 'GB28181'
    wrapper.vm.handleQueryTypeChange()
    await flushAll()
    expect(getDeviceList).toHaveBeenLastCalledWith(
      expect.objectContaining({ device_type: 'GB28181', pageNum: 1 })
    )
    wrapper.destroy()
  })

  it('点击同步国标设备：调用 syncGb28181Devices(1)、提示统计并刷新列表', async () => {
    const wrapper = createWrapper()
    await flushAll()
    const msgSpy = wrapper.vm.$modal.msgSuccess
    await wrapper.vm.handleSyncGb28181()
    expect(syncGb28181Devices).toHaveBeenCalledWith(1)
    expect(msgSpy).toHaveBeenCalledWith(expect.stringContaining('新增 2'))
    expect(msgSpy).toHaveBeenCalledWith(expect.stringContaining('离线 0'))
    expect(getDeviceList).toHaveBeenCalled()
    expect(wrapper.vm.syncing).toBe(false)
    wrapper.destroy()
  })

  it('同步异常时提示错误并复位加载态', async () => {
    const wrapper = createWrapper()
    await flushAll()
    syncGb28181Devices.mockRejectedValue(new Error('网络异常'))
    const errSpy = wrapper.vm.$modal.msgError
    await wrapper.vm.handleSyncGb28181()
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('同步失败'))
    expect(wrapper.vm.syncing).toBe(false)
    wrapper.destroy()
  })

  it('GB28181 设备进入编辑：只读国标信息、不出现 RTSP 直连输入', async () => {
    getDevice.mockResolvedValue({
      data: {
        ape_id: 'gb-34020000001320000001-34020000001310000001',
        name: '国标摄像机A',
        device_type: 'GB28181',
        stream_source_type: 'PLATFORM',
        gb_platform_id: '34020000002000000001',
        gb_device_id: '34020000001320000001',
        gb_channel_id: '34020000001310000001',
        play_url: 'rtsp://127.0.0.1:9994/GB/34020000001320000001_34020000001310000001',
        is_online: 1
      }
    })
    const wrapper = createWrapper()
    await flushAll()
    wrapper.vm.handleUpdate({ ape_id: 'gb-34020000001320000001-34020000001310000001' })
    await flushAll()
    expect(wrapper.vm.form.device_type).toBe('GB28181')
    expect(wrapper.vm.form.is_online).toBe('1')
    // el-dialog append-to-body：对话框内容渲染到 document.body；国标字段是 input value
    const bodyText = document.body.textContent
    expect(bodyText).toContain('国标信息')
    const dialogInputs = Array.from(document.querySelectorAll('.el-dialog input'))
    const dialogValues = dialogInputs.map(input => input.value)
    expect(dialogValues).toContain('34020000001310000001')
    const hasRtspPlaceholder = dialogInputs.some(input => (input.placeholder || '').indexOf('视频流地址') !== -1)
    expect(hasRtspPlaceholder).toBe(false)
    wrapper.destroy()
  })

  it('GB28181 提交 payload 不携带 direct_source_url（禁止前端覆盖目录流地址）', async () => {
    const wrapper = createWrapper()
    await flushAll()
    wrapper.vm.form.device_type = 'GB28181'
    wrapper.vm.form.stream_source_type = 'PLATFORM'
    wrapper.vm.form.direct_source_url = 'rtsp://127.0.0.1:9994/secret/do-not-overwrite'
    const payload = wrapper.vm.buildSubmitPayload()
    expect(payload.device_type).toBe('GB28181')
    expect(payload.direct_source_url).toBeUndefined()
    wrapper.destroy()
  })

  it('RTSP 手动新增默认接入类型 RTSP、格式化为 RTSP 标签', async () => {
    const wrapper = createWrapper()
    await flushAll()
    wrapper.vm.handleAdd()
    expect(wrapper.vm.form.device_type).toBe('RTSP')
    expect(wrapper.vm.form.stream_source_type).toBe('DIRECT')
    expect(wrapper.vm.formatDeviceType('GB28181')).toBe('国标')
    expect(wrapper.vm.formatDeviceType('RTSP')).toBe('RTSP')
    expect(wrapper.vm.formatDeviceType(undefined)).toBe('RTSP')
    expect(wrapper.vm.formatDeviceTypeTag('GB28181')).toBe('warning')
    expect(wrapper.vm.formatDeviceTypeTag('RTSP')).toBe('info')
    wrapper.destroy()
  })
})
