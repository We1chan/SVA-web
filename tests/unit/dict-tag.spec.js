import DictTag from '@/components/DictTag/index.vue'

describe('dictionary unmatched values', () => {
  it('computes unmatched values without mutating component state', () => {
    const context = Object.freeze({ values: ['1', '2'], options: [{ value: '1' }] })
    expect(DictTag.computed.unmatchArray.call(context)).toEqual(['2'])
    expect(DictTag.computed.unmatch.call({ unmatchArray: ['2'] })).toBe(true)
  })
})
