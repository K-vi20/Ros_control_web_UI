/** Fixed-decimal number using a true minus sign, as used in the design (e.g. −3.40). */
export function formatNum(value: number, decimals = 2): string {
  return value.toFixed(decimals).replace('-', '−')
}

export function parseNum(text: string): number {
  return parseFloat(text.trim().replace('−', '-').replace(',', '.'))
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  if (s < 60) return `${s} s`
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`
}

export function twoDigits(n: number): string {
  return String(n).padStart(2, '0')
}

export function utcTime(date = new Date()): string {
  return date.toISOString().slice(11, 19)
}
