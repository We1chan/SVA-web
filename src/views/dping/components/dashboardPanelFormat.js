const numberOrZero = value => Number.isFinite(Number(value)) ? Number(value) : 0

export function buildDeviceStatusCards(data = {}) {
  return [
    { key: 'total', label: '监测点', value: numberOrZero(data.deviceNum), tone: 'cyan' },
    { key: 'online', label: '在线', value: numberOrZero(data.deviceEnableNum), tone: 'green' },
    { key: 'offline', label: '离线', value: numberOrZero(data.deviceli), tone: 'amber' }
  ]
}

export function buildGrowthRows(data = {}) {
  return [
    { key: 'month', label: '月度', growth: numberOrZero(data.monthGrowthRate), treatment: numberOrZero(data.monthRectification) },
    { key: 'quarter', label: '季度', growth: numberOrZero(data.quarteGrowthRate), treatment: numberOrZero(data.quarterRectification) },
    { key: 'year', label: '年度', growth: numberOrZero(data.yearGrowthRate), treatment: numberOrZero(data.yearRectification) }
  ]
}

export function buildSummaryCards(data = {}) {
  return [
    { key: 'year', label: '年度报警', value: numberOrZero(data.lastYear), query: { withQue: 3 }},
    { key: 'month', label: '当月报警', value: numberOrZero(data.instant), query: { withQue: 2 }},
    { key: 'handled', label: '已处置报警', value: numberOrZero(data.num), query: { withQue: 3, is_handle: 1 }}
  ]
}
