import { toApiError } from '../../utils/api'
import { inspectAdaptiveDataset } from '../../services/adaptiveDataset'

export default defineEventHandler(async (event) => {
  try {
    const form = await readMultipartFormData(event)
    if (!form) {
      throw new Error('Form upload tidak valid')
    }

    const files = form
      .filter((item) => item.filename && item.data)
      .map((item) => ({
        filename: item.filename || 'dataset.csv',
        content: item.data.toString('utf8')
      }))

    return inspectAdaptiveDataset(files)
  } catch (error) {
    throw toApiError(error)
  }
})
