export function useFormat() {
  const number = (value: number | string | null | undefined, digits = 2) => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return '-'

    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(parsed)
  }

  const percent = (value: number | string | null | undefined, digits = 2) => `${number(value, digits)}%`

  return { number, percent }
}
