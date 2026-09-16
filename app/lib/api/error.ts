export type ApiFieldError = string | string[]
export type ApiFieldErrors = Record<string, ApiFieldError>

interface ApiErrorResponse {
  error?: string
  message?: string
  fieldErrors?: unknown
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly fieldErrors?: ApiFieldErrors,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Retains only the string and string-array field error shapes supported by the API. */
function normalizeFieldErrors(value: unknown): ApiFieldErrors | undefined {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return undefined

  const fieldErrors: ApiFieldErrors = {}
  for (const [field, messages] of Object.entries(value)) {
    if (typeof messages === 'string') {
      fieldErrors[field] = messages
    }
    else if (Array.isArray(messages)) {
      const stringMessages = messages.filter((message): message is string => typeof message === 'string')
      if (stringMessages.length > 0) fieldErrors[field] = stringMessages
    }
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined
}

/** Converts ofetch's backend response shape into one error type for screens and forms. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  const fetchError = error as {
    data?: ApiErrorResponse
    statusCode?: number
    message?: string
  }
  const message = fetchError.data?.error
    || fetchError.data?.message
    || fetchError.message
    || '通信に失敗しました。時間をおいて再度お試しください。'

  return new ApiError(message, fetchError.statusCode, normalizeFieldErrors(fetchError.data?.fieldErrors))
}
