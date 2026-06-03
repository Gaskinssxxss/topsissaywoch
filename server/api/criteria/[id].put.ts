import { getDb } from '../../utils/db'
import { toApiError } from '../../utils/api'
import { normalizeCriteriaType, requireInteger, requireNumber, requireString } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  try {
    const id = requireInteger(getRouterParam(event, 'id'), 'id')
    const body = await readBody(event)
    const payload = {
      id,
      code: requireString(body.code, 'code'),
      name: requireString(body.name, 'name'),
      weight: requireNumber(body.weight, 'weight'),
      type: normalizeCriteriaType(body.type)
    }

    const db = getDb()
    const result = db.prepare(`
      UPDATE criteria
      SET code = @code, name = @name, weight = @weight, type = @type, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run(payload)

    if (result.changes === 0) {
      throw new Error('Kriteria tidak ditemukan')
    }

    return db.prepare('SELECT * FROM criteria WHERE id = ?').get(id)
  } catch (error) {
    throw toApiError(error)
  }
})
