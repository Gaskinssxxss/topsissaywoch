import { getTopsisResults } from '../../services/topsis'
import { requireInteger } from '../../utils/validation'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const year = requireInteger(query.year ?? 2024, 'year')
  return getTopsisResults(year)
})
