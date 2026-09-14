export interface CreateUserRequest {
  userName: string
  email: string
  password: string
}

export interface UserResponse {
  id: number
  userName: string
  email: string
}