export interface RegistrationRequest {
  userName: string
  gender: string
  ageGroup: string
  studentType: string
  school: string // 穴吹カレッジ=学校選択値 / その他の学校=入力された学校名 / 学生でない=空
  department: string
  agreedTerms: boolean
}

export interface RegistrationResponse {
  id: number
  userName: string
}

export interface NicknameAvailability {
  available: boolean
  reason: string | null
}
