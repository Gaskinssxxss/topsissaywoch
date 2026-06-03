export function requireString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} wajib diisi`)
  }

  return value.trim()
}

export function requireNumber(value: unknown, field: string) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) {
    throw new Error(`${field} harus berupa angka`)
  }

  return numberValue
}

export function requireInteger(value: unknown, field: string) {
  const numberValue = Number(value)
  if (!Number.isInteger(numberValue)) {
    throw new Error(`${field} harus berupa bilangan bulat`)
  }

  return numberValue
}

export function normalizeCriteriaType(value: unknown) {
  const type = requireString(value, 'type').toLowerCase()
  if (type !== 'benefit' && type !== 'cost') {
    throw new Error('type hanya boleh benefit atau cost')
  }

  return type
}
