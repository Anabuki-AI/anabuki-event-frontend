import type { CreateUserRequest, UserResponse } from '../types'
import { request } from '~/lib/api/client'

export function createUser(input: CreateUserRequest): Promise<UserResponse> {
  return request<UserResponse>('/users', {
    method: 'POST',
    body: input,
  })
}