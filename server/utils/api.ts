import { createError } from 'h3'

export function toApiError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server'
  return createError({
    statusCode: 400,
    statusMessage: message
  })
}
