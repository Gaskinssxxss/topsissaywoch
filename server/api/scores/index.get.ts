import { getDb } from '../../utils/db'
import { requireInteger } from '../../utils/validation'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const year = requireInteger(query.year ?? 2024, 'year')
  const db = getDb()

  return db.prepare(`
    SELECT
      s.id,
      s.year,
      s.value,
      a.id AS alternativeId,
      a.code AS alternativeCode,
      a.name AS alternativeName,
      c.id AS criteriaId,
      c.code AS criteriaCode,
      c.name AS criteriaName,
      c.type AS criteriaType,
      c.weight AS criteriaWeight
    FROM alternative_scores s
    JOIN alternatives a ON a.id = s.alternative_id
    JOIN criteria c ON c.id = s.criteria_id
    WHERE s.year = ?
    ORDER BY a.code, c.code
  `).all(year)
})
