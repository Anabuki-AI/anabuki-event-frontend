import type { NitroFetchRequest, NitroFetchOptions } from 'nitropack'
import { toApiError } from './error'

export async function request<T>(path: string, options: NitroFetchOptions<NitroFetchRequest> = {}): Promise<T> {
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
