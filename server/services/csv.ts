import fs from 'node:fs'

export function parseCsvFile(path: string) {
  const content = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '')
  return parseCsvContent(content)
}

export function parseCsvContent(content: string) {
  content = content.replace(/^\uFEFF/, '')
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '')
  if (lines.length === 0) return []
  const headers = parseCsvLine(lines[0])

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
  })
}

export function parseCsvNumber(value: string) {
  const cleaned = value.replaceAll(',', '').trim()
  const numberValue = Number(cleaned)
  if (!Number.isFinite(numberValue)) {
    throw new Error(`Nilai CSV tidak valid: ${value}`)
  }

  return numberValue
}

function parseCsvLine(line: string) {
  const result: string[] = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"' && quoted && next === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      quoted = !quoted
      continue
    }

    if (char === ',' && !quoted) {
      result.push(current)
      current = ''
      continue
    }

    current += char
  }

  result.push(current)
  return result
}
