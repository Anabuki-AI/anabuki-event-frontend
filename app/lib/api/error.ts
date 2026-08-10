import type { FetchError } from 'ofetch'

interface ApiErrorResponse {
  error?: string
  message?: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  const fetchError = error as FetchError<ApiErrorResponse>
  const message = fetchError.data?.error
    || fetchError.data?.message
    || fetchError.message
    || '通信に失敗しました。時間をおいて再度お試しください。'

  return new ApiError(message, fetchError.statusCode)
}
