import { toApiError } from '../../utils/api'
import { clearImportedDataset } from '../../services/adaptiveDataset'

export default defineEventHandler(() => {
  try {
    return clearImportedDataset()
  } catch (error) {
    throw toApiError(error)
  }
})
