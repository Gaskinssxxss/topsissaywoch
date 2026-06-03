import { toApiError } from '../../utils/api'
import { importAdaptiveDataset } from '../../services/adaptiveDataset'

export default defineEventHandler(async (event) => {
  try {
    const form = await readMultipartFormData(event)
    if (!form) {
      throw new Error('Form upload tidak valid')
    }

    const yearField = form.find((item) => item.name === 'year')
    const processField = form.find((item) => item.name === 'process')
    const year = Number(yearField?.data?.toString())
    const processTopsis = processField?.data?.toString() !== 'false'

    if (!Number.isInteger(year)) {
      throw new Error('Pilih tahun data valid dari hasil baca dataset')
    }

    const files = form
      .filter((item) => item.filename && item.data)
      .map((item) => ({
        filename: item.filename || 'dataset.csv',
        content: item.data.toString('utf8')
      }))

    return importAdaptiveDataset(files, year, { processTopsis })
  } catch (error) {
    throw toApiError(error)
  }
})
