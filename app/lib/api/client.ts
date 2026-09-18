import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack/types'
import { toApiError } from './error'

export const GET_TIMEOUT_MS = 20_000

export async function request<T>(path: NitroFetchRequest, options: NitroFetchOptions<NitroFetchRequest> = {}): Promise<T> {
  const config = useRuntimeConfig()
  const method = String(options.method ?? 'GET').toUpperCase()
  const getDefaults = method === 'GET'
    ? { retry: 0, timeout: GET_TIMEOUT_MS }
    : {}

  try {
    return await $fetch<T>(path, {
      baseURL: config.public.apiBase,
      credentials: 'include',
      ...getDefaults,
      ...options,
      // ofetchのFetchOptionsとNuxtアプリの$fetch(Nitro型)のmethod型差異を吸収する
    } as Parameters<typeof $fetch>[1])
  }
  catch (error) {
    throw toApiError(error)
  }
}
