import { describe, expect, it } from 'vitest'
import { ApiError, toApiError } from '../../app/lib/api/error'

describe('toApiError', () => {
  it('normalizes a backend error response', () => {
    const error = toApiError({
      data: { error: 'Email is already registered' },
      statusCode: 409,
      message: 'Request failed',
    })

    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('Email is already registered')
    expect(error.statusCode).toBe(409)
  })

  it('keeps an existing ApiError', () => {
    const original = new ApiError('User not found', 404)

    expect(toApiError(original)).toBe(original)
  })
})
