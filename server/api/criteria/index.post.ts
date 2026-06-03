import { getDb } from '../../utils/db'
import { toApiError } from '../../utils/api'
import { normalizeCriteriaType, requireNumber, requireString } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const payload = {
      code: requireString(body.code, 'code'),
      name: requireString(body.name, 'name'),
      weight: requireNumber(body.weight, 'weight'),
      type: normalizeCriteriaType(body.type)
    }

    const db = getDb()
    const result = db.prepare(`
      INSERT INTO criteria (code, name, weight, type)
      VALUES (@code, @name, @weight, @type)
    `).run(payload)

    return db.prepare('SELECT * FROM criteria WHERE id = ?').get(result.lastInsertRowid)
  } catch (error) {
    throw toApiError(error)
  }
})
