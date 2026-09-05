import { alarmPeriod } from '@/utils/alarmPeriod'

describe('current alarm calendar periods', () => {
  const now = new Date('2026-09-05T04:00:00Z')
  it('shows the Monday-to-Sunday week across a month boundary', () => {
    expect(alarmPeriod('1', now)).toContain('2026-08-31 — 2026-09-06')
  })
  it('shows the selected month, quarter and year', () => {
    expect(alarmPeriod('2', now)).toContain('2026-09-01 — 2026-09-30')
    expect(alarmPeriod('3', now)).toContain('2026-07-01 — 2026-09-30')
    expect(alarmPeriod('4', now)).toContain('2026-01-01 — 2026-12-31')
  })
  it('uses Shanghai time and handles leap years', () => {
    expect(alarmPeriod('2', new Date('2024-01-31T16:30:00Z'))).toContain('2024-02-01 — 2024-02-29')
  })
})
