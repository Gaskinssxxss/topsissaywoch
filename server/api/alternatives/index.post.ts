import { getDb } from '../../utils/db'
import { toApiError } from '../../utils/api'
import { requireString } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const payload = {
      code: requireString(body.code, 'code'),
      name: requireString(body.name, 'name'),
      province: requireString(body.province ?? 'Nusa Tenggara Barat', 'province')
    }

    const db = getDb()
    const result = db.prepare(`
      INSERT INTO alternatives (code, name, province)
      VALUES (@code, @name, @province)
    `).run(payload)

    return db.prepare('SELECT * FROM alternatives WHERE id = ?').get(result.lastInsertRowid)
  } catch (error) {
    throw toApiError(error)
  }
})
