export function getPriorityCategory(value: number) {
  if (value >= 0.8) return 'Prioritas sangat tinggi'
  if (value >= 0.6) return 'Prioritas tinggi'
  if (value >= 0.4) return 'Prioritas sedang'
  if (value >= 0.2) return 'Prioritas rendah'
  return 'Prioritas sangat rendah'
}
