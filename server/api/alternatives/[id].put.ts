import { getDb } from '../../utils/db'
import { toApiError } from '../../utils/api'
import { requireInteger, requireString } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  try {
    const id = requireInteger(getRouterParam(event, 'id'), 'id')
    const body = await readBody(event)
    const payload = {
      id,
      code: requireString(body.code, 'code'),
      name: requireString(body.name, 'name'),
      province: requireString(body.province ?? 'Nusa Tenggara Barat', 'province')
    }

    const db = getDb()
    const result = db.prepare(`
      UPDATE alternatives
      SET code = @code, name = @name, province = @province, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run(payload)

    if (result.changes === 0) {
      throw new Error('Alternatif tidak ditemukan')
    }

    return db.prepare('SELECT * FROM alternatives WHERE id = ?').get(id)
  } catch (error) {
    throw toApiError(error)
  }
})
