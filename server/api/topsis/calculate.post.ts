import { toApiError } from '../../utils/api'
import { calculateTopsis } from '../../services/topsis'
import { requireInteger } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const year = requireInteger(body.year ?? 2024, 'year')
    return calculateTopsis(year, true)
  } catch (error) {
    throw toApiError(error)
  }
})
