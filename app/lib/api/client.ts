import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack/types'
import { toApiError } from './error'

export async function request<T>(path: NitroFetchRequest, options: NitroFetchOptions<NitroFetchRequest> = {}): Promise<T> {
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
