// =============================================================
// ECharts 生命周期辅助（阶段 3）
// - useChart：复用同一 DOM 上的实例，避免重复 init 泄漏；
//   用 ResizeObserver 监听容器尺寸变化并 resize，不可用时回退 window resize。
// - disposeChart：在组件销毁时断开 observer / 移除监听并 dispose 实例。
// 实例与 observer 的关系保存在 WeakMap，key 为容器 DOM 节点。
// =============================================================
import * as echarts from 'echarts'

const registry = new WeakMap()

export function useChart(el) {
  if (!el) return null

  const existing = registry.get(el)
  if (existing && existing.inst && !existing.inst.isDisposed()) {
    // 已存在实例：直接 resize 保活并返回，避免重复 init
    existing.inst.resize()
    return existing.inst
  }

  const inst = echarts.init(el)

  let observer = null
  let onResize = null

  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => {
      if (inst && !inst.isDisposed()) inst.resize()
    })
    observer.observe(el)
  } else {
    onResize = () => {
      if (inst && !inst.isDisposed()) inst.resize()
    }
    window.addEventListener('resize', onResize)
  }

  registry.set(el, { inst, observer, onResize })
  return inst
}

export function disposeChart(el) {
  if (!el) return
  const entry = registry.get(el)
  if (!entry) return

  if (entry.observer) {
    entry.observer.disconnect()
  } else if (entry.onResize) {
    window.removeEventListener('resize', entry.onResize)
  }

  if (entry.inst && !entry.inst.isDisposed()) {
    entry.inst.dispose()
  }

  registry.delete(el)
}
