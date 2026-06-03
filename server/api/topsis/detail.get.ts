import { createError } from 'h3'
import { getTopsisDetail } from '../../services/topsis'
import { requireInteger } from '../../utils/validation'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const year = requireInteger(query.year ?? 2024, 'year')
  const detail = getTopsisDetail(year)

  if (!detail) {
    throw createError({
      statusCode: 404,
      statusMessage: `Detail perhitungan TOPSIS tahun ${year} belum tersedia`
    })
  }

  return detail
})
