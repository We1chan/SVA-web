/**
 * device.js API 层 GB28181 适配测试（阶段 3）
 * 断言 syncGb28181Devices / refreshGb28181Status 发往正确 URL 并携带 zlmServerId。
 */
import request from '@/utils/request'
import { syncGb28181Devices, refreshGb28181Status } from '@/api/device'

jest.mock('@/utils/request', () => jest.fn())

describe('device.js GB28181 API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('syncGb28181Devices 默认 POST /waring/device/gb28181/catalog/sync?zlmServerId=1', () => {
    syncGb28181Devices()
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/waring/device/gb28181/catalog/sync'),
        method: 'post',
        params: { zlmServerId: 1 },
        timeout: 30000
      })
    )
  })

  it('syncGb28181Devices 可指定 zlmServerId', () => {
    syncGb28181Devices(2)
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ params: { zlmServerId: 2 } })
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
})
