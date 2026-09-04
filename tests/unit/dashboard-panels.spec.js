import {
  buildDeviceStatusCards,
  buildGrowthRows,
  buildSummaryCards
} from '@/views/dping/components/dashboardPanelFormat'

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
})
