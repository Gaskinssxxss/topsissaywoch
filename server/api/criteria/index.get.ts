import { getDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = getDb()
  return db.prepare(`
    SELECT id, code, name, weight, type, created_at AS createdAt, updated_at AS updatedAt
    FROM criteria
    ORDER BY code
  `).all()
})
