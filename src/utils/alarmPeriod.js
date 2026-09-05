// The dashboard endpoints aggregate the current calendar period (Monday first).
export function alarmPeriod(type, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const value = name => Number(parts.find(p => p.type === name).value)
  const year = value('year'), month = value('month') - 1, day = value('day')
  let start = new Date(Date.UTC(year, month, day)), end, label
  if (type === '1') {
    start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7)
    end = new Date(start); end.setUTCDate(end.getUTCDate() + 6)
    label = '本周（周一至周日）'
  } else if (type === '3') {
    const quarter = Math.floor(month / 3)
    start = new Date(Date.UTC(year, quarter * 3, 1)); end = new Date(Date.UTC(year, quarter * 3 + 3, 0))
    label = `${year}年 · 第${quarter + 1}季度`
  } else if (type === '4') {
    start = new Date(Date.UTC(year, 0, 1)); end = new Date(Date.UTC(year, 11, 31)); label = `${year}年`
  } else {
    start = new Date(Date.UTC(year, month, 1)); end = new Date(Date.UTC(year, month + 1, 0)); label = `${year}年${month + 1}月`
  }
  return `${label} · ${start.toISOString().slice(0, 10)} — ${end.toISOString().slice(0, 10)}`
}
