import { getDb } from '../../utils/db'
import { toApiError } from '../../utils/api'
import { requireInteger } from '../../utils/validation'

export default defineEventHandler((event) => {
  try {
    const id = requireInteger(getRouterParam(event, 'id'), 'id')
    const result = getDb().prepare('DELETE FROM alternatives WHERE id = ?').run(id)

    if (result.changes === 0) {
      throw new Error('Alternatif tidak ditemukan')
    }

    return { deleted: true, id }
  } catch (error) {
    throw toApiError(error)
  }
})
