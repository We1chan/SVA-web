/**
 * 图表生命周期辅助（src/utils/dashboard.js）单元测试
 * 覆盖：实例复用、ResizeObserver 监听、销毁时 observer 释放与 dispose。
 */
import { useChart, disposeChart } from '@/utils/dashboard'

const mockInst = { resize: jest.fn(), dispose: jest.fn(), isDisposed: () => false }

jest.mock('echarts', () => ({
  init: jest.fn(() => mockInst),
  getInstanceByDom: jest.fn(() => null)
}))

let roInstance = null
class ResizeObserverMock {
  constructor() {
    roInstance = this
    this.disconnect = jest.fn()
  }
  observe() {}
}
global.ResizeObserver = ResizeObserverMock

describe('dashboard 图表生命周期', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockInst.isDisposed = () => false
    roInstance = null
  })

  it('useChart 仅 init 一次并复用同一实例，且建立 ResizeObserver', () => {
    const el = document.createElement('div')
    const a = useChart(el)
    const b = useChart(el)
    expect(a).toBe(mockInst)
    expect(b).toBe(mockInst)
    expect(require('echarts').init).toHaveBeenCalledTimes(1)
    expect(roInstance).not.toBeNull()
  })

  it('disposeChart 销毁时断开 observer 并 dispose 实例', () => {
    const el = document.createElement('div')
    useChart(el)
    disposeChart(el)
    expect(roInstance.disconnect).toHaveBeenCalled()
    expect(mockInst.dispose).toHaveBeenCalled()
  })

  it('ResizeObserver 不可用时回退 window resize 监听，并在销毁时移除', () => {
    const saved = global.ResizeObserver
    global.ResizeObserver = undefined

    const addSpy = jest.spyOn(window, 'addEventListener')
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    const el = document.createElement('div')
    useChart(el)
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    const handler = addSpy.mock.calls.find(c => c[0] === 'resize')[1]
    handler()
    expect(mockInst.resize).toHaveBeenCalled()

    disposeChart(el)
    expect(removeSpy).toHaveBeenCalledWith('resize', handler)

    addSpy.mockRestore()
    removeSpy.mockRestore()
    global.ResizeObserver = saved
  })
})
