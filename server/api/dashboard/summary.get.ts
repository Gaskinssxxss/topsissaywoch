import { getDb } from '../../utils/db'
import { requireInteger } from '../../utils/validation'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const db = getDb()
  const years = db.prepare('SELECT DISTINCT year FROM alternative_scores ORDER BY year DESC').all()
  const latestYear = (years[0] as any)?.year ?? null
  const activeYear = query.year !== undefined
    ? requireInteger(query.year, 'year')
    : latestYear
  const topResult = activeYear
    ? db.prepare(`
      SELECT
        tr.rank,
        tr.preference_value AS preferenceValue,
        tr.category,
        a.code AS alternativeCode,
        a.name AS alternativeName
      FROM topsis_results tr
      JOIN alternatives a ON a.id = tr.alternative_id
      WHERE tr.year = ? AND tr.rank = 1
    `).get(activeYear)
    : null
  const scores = activeYear
    ? (db.prepare('SELECT COUNT(*) AS total FROM alternative_scores WHERE year = ?').get(activeYear) as any).total
    : 0

  return {
    alternatives: (db.prepare('SELECT COUNT(*) AS total FROM alternatives').get() as any).total,
    criteria: (db.prepare('SELECT COUNT(*) AS total FROM criteria').get() as any).total,
    scores,
    years: years.map((row: any) => row.year),
    latestYear,
    activeYear,
    topResult
  }
})
