import { mount } from '@vue/test-utils'
import HazardDistribution from '@/views/home/components/hazard-distribution.vue'

const mockGetColumn = jest.fn(() => Promise.resolve({ data: [] }))
const mockGetTypeSpread = jest.fn(() => Promise.resolve({ data: [] }))

jest.mock('@/api/system/kanban', () => ({
  getColumn: (...args) => mockGetColumn(...args),
  getTypeSpread: (...args) => mockGetTypeSpread(...args)
}))

jest.mock('@opentiny/vue', () => ({
  Layout: { render(h) { return h('div', { class: 'tiny-layout' }, this.$slots.default) } },
  Row: { render(h) { return h('div', { class: 'tiny-row' }, this.$slots.default) } },
  Col: { render(h) { return h('div', { class: 'tiny-col' }, this.$slots.default) } }
}))

jest.mock('@/utils/dashboard', () => ({
  useChart: jest.fn(() => ({ on: jest.fn(), setOption: jest.fn() })),
  disposeChart: jest.fn()
}))

describe('hazard-distribution time controls', () => {
  it('changes the selected period when each time button is clicked', async () => {
    const wrapper = mount(HazardDistribution, {
      mocks: { $router: { push: jest.fn() } }
    })
    await wrapper.vm.$nextTick()

    const controls = wrapper.findAll('.distribution-time-button')
    expect(controls).toHaveLength(8)

    await controls.at(0).trigger('click')
    await controls.at(7).trigger('click')

    expect(wrapper.vm.selectedTime1).toBe('1')
    expect(wrapper.vm.selectedTime3).toBe('4')
    expect(mockGetColumn).toHaveBeenCalledWith('', '1')
    expect(mockGetTypeSpread).toHaveBeenCalledWith('', '4')
    wrapper.destroy()
  })
})
