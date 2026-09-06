import {
  buildTreatmentChartOption,
  buildTreatmentSummary
} from '@/views/dping/components/treatmentSummaryFormat'

describe('buildTreatmentSummary', () => {
  it('maps the three treatment states and calculates completion safely', () => {
    expect(buildTreatmentSummary([
      { is_handle: '未处理', num: 34 },
      { is_handle: '误报', num: 2 },
      { is_handle: '已处理', num: 11 }
    ])).toEqual({
      total: 47,
      handled: 11,
      completionRate: 23,
      items: [
        { key: 'pending', name: '未处理', value: 34, percent: 72, color: '#A9E52F' },
        { key: 'falsePositive', name: '误报', value: 2, percent: 4, color: '#36D7ED' },
        { key: 'handled', name: '已处理', value: 11, percent: 23, color: '#238CE7' }
      ]
    })
  })

  it('returns zero metrics when the API omits status rows', () => {
    expect(buildTreatmentSummary([])).toEqual({
      total: 0,
      handled: 0,
      completionRate: 0,
      items: expect.arrayContaining([
        expect.objectContaining({ key: 'pending', value: 0, percent: 0 }),
        expect.objectContaining({ key: 'falsePositive', value: 0, percent: 0 }),
        expect.objectContaining({ key: 'handled', value: 0, percent: 0 })
      ])
    })
  })

  it('treats non-finite, negative, and nonnumeric counts as zero', () => {
    ;[-1, Infinity, NaN, 'not-a-number'].forEach(num => {
      expect(buildTreatmentSummary([
        { is_handle: '未处理', num }
      ])).toMatchObject({
        total: 0,
        handled: 0,
        completionRate: 0,
        items: [
          { key: 'pending', value: 0, percent: 0 },
          { key: 'falsePositive', value: 0, percent: 0 },
          { key: 'handled', value: 0, percent: 0 }
        ]
      })
    })
  })

  it('builds a balanced radar donut option from the normalized state colors', () => {
    const option = buildTreatmentChartOption(buildTreatmentSummary([
      { is_handle: '未处理', num: 34 },
      { is_handle: '误报', num: 2 },
      { is_handle: '已处理', num: 11 }
    ]).items)

    expect(option.legend.show).toBe(false)
    expect(option.series[0].radius).toEqual(['53%', '71%'])
    expect(option.series[0].center).toEqual(['50%', '47%'])
    expect(option.series[0].data.map(item => item.itemStyle.color)).toEqual([
      '#A9E52F', '#36D7ED', '#238CE7'
    ])
  })
})
