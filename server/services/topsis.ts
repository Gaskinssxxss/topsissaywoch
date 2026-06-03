import { getDb } from '../utils/db'
import { getPriorityCategory } from './category'

type CriteriaRow = {
  id: number
  code: string
  name: string
  weight: number
  type: 'benefit' | 'cost'
}

type AlternativeRow = {
  id: number
  code: string
  name: string
  province: string
}

type ScoreRow = {
  alternative_id: number
  criteria_id: number
  value: number
}

type MatrixRow = {
  alternativeId: number
  alternativeCode: string
  alternativeName: string
  values: Record<string, number>
}

export function calculateTopsis(year: number, persist = true) {
  const db = getDb()
  const criteria = db.prepare('SELECT id, code, name, weight, type FROM criteria ORDER BY code').all() as CriteriaRow[]
  const alternatives = db.prepare('SELECT id, code, name, province FROM alternatives ORDER BY code').all() as AlternativeRow[]

  validateBaseData(year, alternatives, criteria)

  const scores = db.prepare(`
    SELECT alternative_id, criteria_id, value
    FROM alternative_scores
    WHERE year = ?
  `).all(year) as ScoreRow[]

  const scoreMap = new Map(scores.map((score) => [`${score.alternative_id}:${score.criteria_id}`, score.value]))
  const missing = []

  for (const alternative of alternatives) {
    for (const criterion of criteria) {
      if (!scoreMap.has(`${alternative.id}:${criterion.id}`)) {
        missing.push({ alternative: alternative.name, criteria: criterion.name })
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(`Data nilai belum lengkap untuk tahun ${year}: ${JSON.stringify(missing)}`)
  }

  const decisionMatrix: MatrixRow[] = alternatives.map((alternative) => ({
    alternativeId: alternative.id,
    alternativeCode: alternative.code,
    alternativeName: alternative.name,
    values: Object.fromEntries(criteria.map((criterion) => [
      criterion.code,
      scoreMap.get(`${alternative.id}:${criterion.id}`) as number
    ]))
  }))

  const divisors = Object.fromEntries(criteria.map((criterion) => {
    const sumOfSquares = decisionMatrix.reduce((sum, row) => sum + (row.values[criterion.code] ** 2), 0)
    const divisor = Math.sqrt(sumOfSquares)
    if (divisor === 0) {
      throw new Error(`Pembagi normalisasi untuk ${criterion.name} bernilai 0`)
    }

    return [criterion.code, divisor]
  }))

  const normalizedMatrix = decisionMatrix.map((row) => ({
    ...row,
    values: Object.fromEntries(criteria.map((criterion) => [
      criterion.code,
      row.values[criterion.code] / divisors[criterion.code]
    ]))
  }))

  const weightedMatrix = normalizedMatrix.map((row) => ({
    ...row,
    values: Object.fromEntries(criteria.map((criterion) => [
      criterion.code,
      row.values[criterion.code] * criterion.weight
    ]))
  }))

  const idealPositive = Object.fromEntries(criteria.map((criterion) => {
    const values = weightedMatrix.map((row) => row.values[criterion.code])
    return [criterion.code, criterion.type === 'benefit' ? Math.max(...values) : Math.min(...values)]
  }))

  const idealNegative = Object.fromEntries(criteria.map((criterion) => {
    const values = weightedMatrix.map((row) => row.values[criterion.code])
    return [criterion.code, criterion.type === 'benefit' ? Math.min(...values) : Math.max(...values)]
  }))

  const distances = weightedMatrix.map((row) => {
    const dPlus = Math.sqrt(criteria.reduce((sum, criterion) => {
      return sum + ((row.values[criterion.code] - idealPositive[criterion.code]) ** 2)
    }, 0))
    const dMinus = Math.sqrt(criteria.reduce((sum, criterion) => {
      return sum + ((row.values[criterion.code] - idealNegative[criterion.code]) ** 2)
    }, 0))
    const preferenceValue = dPlus + dMinus === 0 ? 0 : dMinus / (dPlus + dMinus)

    return {
      alternativeId: row.alternativeId,
      alternativeCode: row.alternativeCode,
      alternativeName: row.alternativeName,
      dPlus,
      dMinus,
      preferenceValue
    }
  })

  const results = [...distances]
    .sort((a, b) => b.preferenceValue - a.preferenceValue)
    .map((result, index) => ({
      ...result,
      rank: index + 1,
      category: getPriorityCategory(result.preferenceValue)
    }))

  const payload = {
    year,
    criteria,
    divisors,
    decisionMatrix,
    normalizedMatrix,
    weightedMatrix,
    idealPositive,
    idealNegative,
    distances,
    results
  }

  if (persist) {
    persistTopsis(year, payload)
  }

  return payload
}

export function getTopsisResults(year: number) {
  const db = getDb()
  return db.prepare(`
    SELECT
      tr.id,
      tr.year,
      tr.d_plus AS dPlus,
      tr.d_minus AS dMinus,
      tr.preference_value AS preferenceValue,
      tr.rank,
      tr.category,
      a.id AS alternativeId,
      a.code AS alternativeCode,
      a.name AS alternativeName
    FROM topsis_results tr
    JOIN alternatives a ON a.id = tr.alternative_id
    WHERE tr.year = ?
    ORDER BY tr.rank ASC
  `).all(year)
}

export function getTopsisDetail(year: number) {
  const db = getDb()
  const detail = db.prepare('SELECT * FROM topsis_details WHERE year = ?').get(year) as any
  if (!detail) return null

  return {
    year: detail.year,
    criteria: JSON.parse(detail.criteria_json),
    decisionMatrix: JSON.parse(detail.decision_matrix_json),
    normalizedMatrix: JSON.parse(detail.normalized_matrix_json),
    weightedMatrix: JSON.parse(detail.weighted_matrix_json),
    idealPositive: JSON.parse(detail.ideal_positive_json),
    idealNegative: JSON.parse(detail.ideal_negative_json),
    distances: JSON.parse(detail.distances_json),
    results: JSON.parse(detail.results_json)
  }
}

function validateBaseData(year: number, alternatives: AlternativeRow[], criteria: CriteriaRow[]) {
  if (!Number.isInteger(year)) {
    throw new Error('Tahun harus berupa bilangan bulat')
  }
  if (alternatives.length < 2) {
    throw new Error('Minimal harus ada 2 alternatif')
  }
  if (criteria.length < 2) {
    throw new Error('Minimal harus ada 2 kriteria')
  }

  const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0)
  if (Math.abs(totalWeight - 1) > 0.000001) {
    throw new Error(`Total bobot kriteria harus 1.00, saat ini ${totalWeight}`)
  }

  for (const criterion of criteria) {
    if (criterion.type !== 'benefit' && criterion.type !== 'cost') {
      throw new Error(`Jenis kriteria ${criterion.name} tidak valid`)
    }
  }
}

function persistTopsis(year: number, payload: ReturnType<typeof calculateTopsis>) {
  const db = getDb()
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM topsis_results WHERE year = ?').run(year)
    db.prepare('DELETE FROM topsis_details WHERE year = ?').run(year)

    const resultStatement = db.prepare(`
      INSERT INTO topsis_results (
        alternative_id,
        year,
        d_plus,
        d_minus,
        preference_value,
        rank,
        category
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    for (const result of payload.results) {
      resultStatement.run(
        result.alternativeId,
        year,
        result.dPlus,
        result.dMinus,
        result.preferenceValue,
        result.rank,
        result.category
      )
    }

    db.prepare(`
      INSERT INTO topsis_details (
        year,
        criteria_json,
        decision_matrix_json,
        normalized_matrix_json,
        weighted_matrix_json,
        ideal_positive_json,
        ideal_negative_json,
        distances_json,
        results_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      year,
      JSON.stringify(payload.criteria),
      JSON.stringify(payload.decisionMatrix),
      JSON.stringify(payload.normalizedMatrix),
      JSON.stringify(payload.weightedMatrix),
      JSON.stringify(payload.idealPositive),
      JSON.stringify(payload.idealNegative),
      JSON.stringify(payload.distances),
      JSON.stringify(payload.results)
    )
  })

  transaction()
}
