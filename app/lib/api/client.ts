import type { FetchOptions } from 'ofetch'
import { toApiError } from './error'

export async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const config = useRuntimeConfig()

  try {
    return await $fetch<T>(path, {
      baseURL: config.public.apiBase,
      ...options,
      // ofetchのFetchOptionsとNuxtアプリの$fetch(Nitro型)のmethod型差異を吸収する
    } as Parameters<typeof $fetch>[1])
  }
  catch (error) {
    throw toApiError(error)
  }
}
