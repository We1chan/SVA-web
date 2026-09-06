import {
  buildDeviceStatusCards,
  buildGrowthRows,
  buildSummaryCards
} from '@/views/dping/components/dashboardPanelFormat'
import { shallowMount } from '@vue/test-utils'
import TotalSummary from '@/views/dping/components/total-summary.vue'
import WarningGrowth from '@/views/dping/components/warning-growth.vue'
import WarningSummary from '@/views/dping/components/warning-summary.vue'

jest.mock('@/api/system/kanban', () => ({
  getMonthWaring: jest.fn(() => new Promise(() => {})),
  getGrowth: jest.fn(() => new Promise(() => {})),
  getLevelSpread: jest.fn(() => new Promise(() => {}))
}))

describe('大屏侧栏数据展示契约', () => {
  it('builds device cards with accurate total/online/offline values', () => {
    expect(buildDeviceStatusCards({ deviceNum: 4, deviceEnableNum: 3, deviceli: 1 })).toEqual([
      { key: 'total', label: '监测点', value: 4, tone: 'cyan' },
      { key: 'online', label: '在线', value: 3, tone: 'green' },
      { key: 'offline', label: '离线', value: 1, tone: 'amber' }
    ])
  })

  it('keeps growth and treatment metrics aligned by month/quarter/year', () => {
    expect(buildGrowthRows({
      monthGrowthRate: 1.2,
      quarteGrowthRate: -2,
      yearGrowthRate: 0,
      monthRectification: 0.5,
      quarterRectification: 0.6,
      yearRectification: 0.7
    })).toEqual([
      { key: 'month', label: '月度', growth: 1.2, treatment: 0.5 },
      { key: 'quarter', label: '季度', growth: -2, treatment: 0.6 },
      { key: 'year', label: '年度', growth: 0, treatment: 0.7 }
    ])
  })

  it('maps summary values to explicit business labels', () => {
    expect(buildSummaryCards({ lastYear: 129, instant: 12, num: 1 })).toEqual([
      { key: 'year', label: '年度报警', value: 129, query: { withQue: 3 } },
      { key: 'month', label: '当月报警', value: 12, query: { withQue: 2 } },
      { key: 'handled', label: '已处置报警', value: 1, query: { withQue: 3, is_handle: 1 } }
    ])
  })

  it('keeps three-digit alarm values and their unit in a dedicated metric group', async () => {
    const wrapper = shallowMount(TotalSummary, {
      stubs: ['router-link']
    })
    await wrapper.setData({ monthWarning: { lastYear: 191, instant: 192, num: 103 } })

    const metrics = wrapper.findAll('.summary-metric')
    expect(metrics).toHaveLength(3)
    expect(metrics.at(0).find('.summary-value').text()).toBe('191')
    expect(metrics.at(0).find('.summary-unit').text()).toBe('条')
    expect(metrics.at(2).find('.summary-value').text()).toBe('103')
    wrapper.destroy()
  })

  it('marks growth-table headers as right-aligned metric columns', () => {
    const wrapper = shallowMount(WarningGrowth)

    expect(wrapper.findAll('.growth-head__metric')).toHaveLength(2)
    wrapper.destroy()
  })

  it('renders the completion-rate center and three balanced treatment metrics', async() => {
    const wrapper = shallowMount(WarningSummary, {
      mocks: {
        $router: { push: jest.fn() }
      }
    })
    await wrapper.setData({ treatmentSummary: {
      total: 47,
      handled: 11,
      completionRate: 23,
      items: [
        { key: 'pending', name: '未处理', value: 34, percent: 72, color: '#A9E52F' },
        { key: 'falsePositive', name: '误报', value: 2, percent: 4, color: '#36D7ED' },
        { key: 'handled', name: '已处理', value: 11, percent: 23, color: '#238CE7' }
      ]
    } })

    expect(wrapper.find('.treatment-rate__value').text()).toBe('23%')
    expect(wrapper.find('.treatment-rate__label').text()).toBe('处理完成率')
    expect(wrapper.findAll('.treatment-metric')).toHaveLength(3)
    expect(wrapper.findAll('button.treatment-metric')).toHaveLength(3)
    expect(wrapper.findAll('.treatment-metric').at(0).text()).toContain('未处理')
    expect(wrapper.findAll('.treatment-metric').at(0).text()).toContain('34')
    expect(wrapper.findAll('.treatment-metric').at(0).text()).toContain('72%')
    expect(wrapper.findAll('.treatment-metric').at(0).attributes('aria-label')).toBe('筛选未处理告警')
    expect(wrapper.findAll('.treatment-metric').at(0).attributes('data-color')).toBe('#A9E52F')
    await wrapper.findAll('button.treatment-metric').at(0).trigger('click')
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith({ path: '/warning/warning', query: { withQue: 2, is_handle: 0 }})
    wrapper.destroy()
  })
})
