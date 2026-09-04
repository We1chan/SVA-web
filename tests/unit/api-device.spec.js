/**
 * device.js API 层 GB28181 适配测试（阶段 3）
 * 断言 syncGb28181Devices / refreshGb28181Status 发往正确 URL 并携带 zlmServerId。
 */
import request from '@/utils/request'
import { syncGb28181Devices, refreshGb28181Status, controlDevicePtz } from '@/api/device'

jest.mock('@/utils/request', () => jest.fn())

describe('device.js GB28181 API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('同步按钮拉取 WVP 目录，不能调用无快照的空对账接口', () => {
    syncGb28181Devices()
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/waring/device/gb28181/sync',
        method: 'post',
        timeout: 30000
      })
    )
  })

  it('refreshGb28181Status POST /waring/device/gb28181/status/refresh', () => {
    refreshGb28181Status(1)
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/waring/device/gb28181/status/refresh'),
        method: 'post',
        params: { zlmServerId: 1 }
      })
    )
  })

  it('云台控制只提交业务设备编码与语义化指令', () => {
    const data = { command: 'left', panSpeed: 50, tiltSpeed: 50, zoomSpeed: 50 }
    controlDevicePtz('gb-1', data)
    expect(request).toHaveBeenCalledWith({
      url: '/waring/device/monitor/gb-1/ptz',
      method: 'post',
      data,
      timeout: 5000
    })
  })
})
