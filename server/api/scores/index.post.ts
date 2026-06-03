import { getDb } from '../../utils/db'
import { toApiError } from '../../utils/api'
import { requireInteger, requireNumber } from '../../utils/validation'

type ScorePayload = {
  alternativeId: unknown
  criteriaId: unknown
  value: unknown
  year: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const scores: ScorePayload[] = Array.isArray(body.scores) ? body.scores : [body]
    const db = getDb()

    const statement = db.prepare(`
      INSERT INTO alternative_scores (alternative_id, criteria_id, value, year, updated_at)
      VALUES (@alternativeId, @criteriaId, @value, @year, CURRENT_TIMESTAMP)
      ON CONFLICT(alternative_id, criteria_id, year) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `)

    const transaction = db.transaction(() => {
      for (const score of scores) {
        statement.run({
          alternativeId: requireInteger(score.alternativeId, 'alternativeId'),
          criteriaId: requireInteger(score.criteriaId, 'criteriaId'),
          value: requireNumber(score.value, 'value'),
          year: requireInteger(score.year, 'year')
        })
      }
    })

    transaction()
    return { saved: scores.length }
  } catch (error) {
    throw toApiError(error)
  }
})
