const STATES = [
  { key: 'pending', name: '未处理', color: '#A9E52F' },
  { key: 'falsePositive', name: '误报', color: '#36D7ED' },
  { key: 'handled', name: '已处理', color: '#238CE7' }
]

export function buildTreatmentSummary(rows = []) {
  const items = STATES.map(state => {
    const row = rows.find(item => item.is_handle === state.name)
    const value = Number(row && row.num)
    return {
      ...state,
      value: Number.isFinite(value) && value >= 0 ? value : 0,
      percent: 0
    }
  })
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const normalizedItems = items.map(item => ({
    ...item,
    percent: total ? Math.round(item.value / total * 100) : 0
  }))
  const handled = normalizedItems.find(item => item.key === 'handled').value

  return {
    total,
    handled,
    completionRate: total ? Math.round(handled / total * 100) : 0,
    items: normalizedItems
  }
}
