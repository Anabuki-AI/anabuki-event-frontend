import type { FetchOptions } from 'ofetch'
import { toApiError } from './error'

export async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const config = useRuntimeConfig()

  try {
    return await $fetch<T>(path, {
      baseURL: config.public.apiBase,
      ...options,
    })
  }
  catch (error) {
    throw toApiError(error)
  }
}
