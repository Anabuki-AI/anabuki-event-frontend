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

  it('keeps string field errors from the backend validation response', () => {
    const error = toApiError({
      data: { error: 'Validation failed', fieldErrors: { questionText: '問題文を入力してください' } },
      statusCode: 422,
    })

    expect(error.fieldErrors).toEqual({ questionText: '問題文を入力してください' })
  })

  it('keeps legacy array field errors from a backend validation response', () => {
    const error = toApiError({
      data: { error: 'Validation failed', fieldErrors: { choiceA: ['選択肢Aを入力してください'] } },
      statusCode: 422,
    })

    expect(error.fieldErrors).toEqual({ choiceA: ['選択肢Aを入力してください'] })
  })

  it('keeps an existing ApiError', () => {
    const original = new ApiError('User not found', 404)

    expect(toApiError(original)).toBe(original)
  })
})
