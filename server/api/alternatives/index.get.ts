import { getDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = getDb()
  return db.prepare(`
    SELECT id, code, name, province, created_at AS createdAt, updated_at AS updatedAt
    FROM alternatives
    ORDER BY code
  `).all()
})
