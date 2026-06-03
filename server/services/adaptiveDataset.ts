import { getDb } from '../utils/db'
import { parseCsvContent, parseCsvNumber } from './csv'
import { calculateTopsis } from './topsis'

const CRITERIA = [
  { code: 'C1', name: 'Prevalensi Stunting', weight: 0.3, type: 'benefit' },
  { code: 'C2', name: 'Prevalensi Wasting', weight: 0.2, type: 'benefit' },
  { code: 'C3', name: 'Prevalensi Underweight', weight: 0.2, type: 'benefit' },
  { code: 'C4', name: 'Persentase Penduduk Miskin', weight: 0.2, type: 'benefit' },
  { code: 'C5', name: 'Sanitasi Layak', weight: 0.1, type: 'cost' }
] as const

type UploadedCsv = {
  filename: string
  content: string
}

type DetectedFile = {
  filename: string
  detected: string[]
  rows: number
}

type AdaptiveScore = {
  code: string
  name: string
  province: string
  values: Record<string, number>
}

function ensureFiles(files: UploadedCsv[]) {
  if (files.length === 0) {
    throw new Error('Minimal upload 1 file CSV')
  }
}

function readAdaptiveScores(files: UploadedCsv[], year: number) {
  const detectedFiles: DetectedFile[] = []
  const scores = new Map<string, AdaptiveScore>()

  const putScore = (code: string, name: string, criteriaCode: string, value: number, province = 'Data Upload') => {
    if (!code || !name || code === '5200' || name === 'Nusa Tenggara Barat') return
    const current = scores.get(code) ?? { code, name, province, values: {} }
    current.name = name
    current.province = province || current.province || 'Data Upload'
    current.values[criteriaCode] = value
    scores.set(code, current)
  }

  for (const file of files) {
    const rows = parseCsvContent(file.content)
    const headers = rows[0] ? Object.keys(rows[0]) : []
    const detected: string[] = []

    if (headers.includes('Persentase Balita Stunting (Persen)')) {
      detected.push('stunting')
      for (const row of rows) {
        if (Number(row.Tahun) !== year) continue
        putScore(
          row['Kode Kabupaten/Kota'],
          row['Nama Kabupaten/Kota'],
          'C1',
          parseCsvNumber(row['Persentase Balita Stunting (Persen)']),
          row.Provinsi
        )
      }
    }

    if (headers.includes('Status Gizi Balita') && headers.includes('Persentase Balita (Persen)')) {
      detected.push('status_gizi')
      for (const row of rows) {
        if (Number(row.Tahun) !== year) continue
        const status = row['Status Gizi Balita']
        if (status.includes('Stunting')) {
          putScore(row['Kode Kabupaten/Kota'], row['Nama Kabupaten/Kota'], 'C1', parseCsvNumber(row['Persentase Balita (Persen)']), row.Provinsi)
        }
        if (status.includes('Wasting')) {
          putScore(row['Kode Kabupaten/Kota'], row['Nama Kabupaten/Kota'], 'C2', parseCsvNumber(row['Persentase Balita (Persen)']), row.Provinsi)
        }
        if (status.includes('Underweight')) {
          putScore(row['Kode Kabupaten/Kota'], row['Nama Kabupaten/Kota'], 'C3', parseCsvNumber(row['Persentase Balita (Persen)']), row.Provinsi)
        }
      }
    }

    if (headers.includes('Persentase Penduduk Miskin (Persen)')) {
      detected.push('kemiskinan')
      for (const row of rows) {
        if (Number(row.Tahun) !== year) continue
        putScore(
          row['Kode Provinsi Kabupaten Kota'],
          row['Nama Provinsi Kabupaten Kota'],
          'C4',
          parseCsvNumber(row['Persentase Penduduk Miskin (Persen)']),
          row.Provinsi || 'Data Upload'
        )
      }
    }

    if (headers.includes('Persentase KK Sanitasi Layak (Persen)')) {
      detected.push('sanitasi_layak')
      for (const row of rows) {
        if (Number(row.Tahun) !== year) continue
        putScore(
          row['Kode Kabupaten/Kota'],
          row['Nama Kabupaten/Kota'],
          'C5',
          parseCsvNumber(row['Persentase KK Sanitasi Layak (Persen)']),
          row.Provinsi
        )
      }
    }

    detectedFiles.push({ filename: file.filename, detected, rows: rows.length })
  }

  return { detectedFiles, scores }
}

function summarizeScores(scores: Map<string, AdaptiveScore>) {
  const missingByAlternative = Array.from(scores.values())
    .map((alternative) => ({
      code: alternative.code,
      name: alternative.name,
      missing: CRITERIA
        .filter((criterion) => alternative.values[criterion.code] === undefined)
        .map((criterion) => criterion.code)
    }))
    .filter((item) => item.missing.length > 0)

  const foundCriteria = new Set<string>()
  for (const alternative of scores.values()) {
    for (const criteriaCode of Object.keys(alternative.values)) {
      foundCriteria.add(criteriaCode)
    }
  }

  const missingCriteria = CRITERIA
    .filter((criterion) => !foundCriteria.has(criterion.code))
    .map((criterion) => ({ code: criterion.code, name: criterion.name }))

  return {
    foundCriteria,
    missingCriteria,
    missingByAlternative,
    preview: Array.from(scores.values()).sort((a, b) => a.code.localeCompare(b.code))
  }
}

export function inspectAdaptiveDataset(files: UploadedCsv[]) {
  ensureFiles(files)

  const allYears = new Set<number>()
  const detectedFiles: DetectedFile[] = []

  for (const file of files) {
    const rows = parseCsvContent(file.content)
    const headers = rows[0] ? Object.keys(rows[0]) : []
    const detected: string[] = []

    if (headers.includes('Persentase Balita Stunting (Persen)')) detected.push('stunting')
    if (headers.includes('Status Gizi Balita') && headers.includes('Persentase Balita (Persen)')) detected.push('status_gizi')
    if (headers.includes('Persentase Penduduk Miskin (Persen)')) detected.push('kemiskinan')
    if (headers.includes('Persentase KK Sanitasi Layak (Persen)')) detected.push('sanitasi_layak')

    for (const row of rows) {
      const year = Number(row.Tahun)
      if (Number.isInteger(year)) {
        allYears.add(year)
      }
    }

    detectedFiles.push({ filename: file.filename, detected, rows: rows.length })
  }

  const validYears: number[] = []
  const invalidYears = []

  for (const year of Array.from(allYears).sort((a, b) => b - a)) {
    const { scores } = readAdaptiveScores(files, year)
    const summary = summarizeScores(scores)
    const valid = scores.size > 0 && summary.missingCriteria.length === 0 && summary.missingByAlternative.length === 0

    if (valid) {
      validYears.push(year)
    } else {
      invalidYears.push({
        year,
        alternatives: scores.size,
        foundCriteria: Array.from(summary.foundCriteria).sort(),
        missingCriteria: summary.missingCriteria,
        missingByAlternative: summary.missingByAlternative.slice(0, 10)
      })
    }
  }

  return {
    detectedFiles,
    allYears: Array.from(allYears).sort((a, b) => b - a),
    validYears,
    invalidYears,
    requiredCriteria: CRITERIA.map((criterion) => ({
      code: criterion.code,
      name: criterion.name
    }))
  }
}

export function importAdaptiveDataset(files: UploadedCsv[], year: number, options?: { processTopsis?: boolean }) {
  ensureFiles(files)

  if (!Number.isInteger(year)) {
    throw new Error('Pilih tahun data yang valid dari dataset')
  }

  const { detectedFiles, scores } = readAdaptiveScores(files, year)

  const missingByAlternative = Array.from(scores.values())
    .map((alternative) => ({
      code: alternative.code,
      name: alternative.name,
      missing: CRITERIA
        .filter((criterion) => alternative.values[criterion.code] === undefined)
        .map((criterion) => criterion.code)
    }))
    .filter((item) => item.missing.length > 0)

  const foundCriteria = new Set<string>()
  for (const alternative of scores.values()) {
    for (const criteriaCode of Object.keys(alternative.values)) {
      foundCriteria.add(criteriaCode)
    }
  }

  const missingCriteria = CRITERIA
    .filter((criterion) => !foundCriteria.has(criterion.code))
    .map((criterion) => ({ code: criterion.code, name: criterion.name }))

  if (scores.size === 0) {
    throw new Error(`Tidak ada data wilayah yang cocok untuk tahun ${year}`)
  }

  if (missingCriteria.length > 0 || missingByAlternative.length > 0) {
    return {
      imported: false,
      year,
      detectedFiles,
      alternatives: Array.from(scores.values()).length,
      foundCriteria: Array.from(foundCriteria).sort(),
      missingCriteria,
      missingByAlternative,
      preview: Array.from(scores.values()).sort((a, b) => a.code.localeCompare(b.code))
    }
  }

  persistAdaptiveScores(year, Array.from(scores.values()))

  const topsis = options?.processTopsis ? calculateTopsis(year, true) : null

  return {
    imported: true,
    year,
    detectedFiles,
    alternatives: scores.size,
    criteria: CRITERIA.length,
    scores: scores.size * CRITERIA.length,
    foundCriteria: Array.from(foundCriteria).sort(),
    missingCriteria: [],
    missingByAlternative: [],
    preview: Array.from(scores.values()).sort((a, b) => a.code.localeCompare(b.code)),
    topResult: topsis?.results[0] ?? null
  }
}

function persistAdaptiveScores(year: number, alternatives: AdaptiveScore[]) {
  const db = getDb()

  const transaction = db.transaction(() => {
    for (const criterion of CRITERIA) {
      db.prepare(`
        INSERT INTO criteria (code, name, weight, type, updated_at)
        VALUES (@code, @name, @weight, @type, CURRENT_TIMESTAMP)
        ON CONFLICT(code) DO UPDATE SET
          name = excluded.name,
          weight = excluded.weight,
          type = excluded.type,
          updated_at = CURRENT_TIMESTAMP
      `).run(criterion)
    }

    const alternativeStatement = db.prepare(`
      INSERT INTO alternatives (code, name, province, updated_at)
      VALUES (@code, @name, @province, CURRENT_TIMESTAMP)
      ON CONFLICT(code) DO UPDATE SET
        name = excluded.name,
        province = excluded.province,
        updated_at = CURRENT_TIMESTAMP
    `)

    for (const alternative of alternatives) {
      alternativeStatement.run({ code: alternative.code, name: alternative.name, province: alternative.province })
    }

    db.prepare('DELETE FROM alternative_scores WHERE year = ?').run(year)
    db.prepare('DELETE FROM topsis_results WHERE year = ?').run(year)
    db.prepare('DELETE FROM topsis_details WHERE year = ?').run(year)

    const alternativeIdByCode = new Map(
      db.prepare('SELECT id, code FROM alternatives').all().map((row: any) => [row.code, row.id])
    )
    const criteriaIdByCode = new Map(
      db.prepare('SELECT id, code FROM criteria').all().map((row: any) => [row.code, row.id])
    )

    const scoreStatement = db.prepare(`
      INSERT INTO alternative_scores (alternative_id, criteria_id, value, year, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)

    for (const alternative of alternatives) {
      for (const criterion of CRITERIA) {
        scoreStatement.run(
          alternativeIdByCode.get(alternative.code),
          criteriaIdByCode.get(criterion.code),
          alternative.values[criterion.code],
          year
        )
      }
    }
  })

  transaction()
}

export function clearImportedDataset() {
  const db = getDb()

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM topsis_details').run()
    db.prepare('DELETE FROM topsis_results').run()
    db.prepare('DELETE FROM alternative_scores').run()
    db.prepare('DELETE FROM alternatives').run()
    db.prepare('DELETE FROM criteria').run()
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('alternatives', 'criteria', 'alternative_scores', 'topsis_results', 'topsis_details')").run()
  })

  transaction()

  return {
    cleared: true,
    alternatives: 0,
    criteria: 0,
    scores: 0,
    results: 0
  }
}
