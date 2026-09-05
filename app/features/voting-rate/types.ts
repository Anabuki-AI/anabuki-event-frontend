export interface QuestionChoice {
  value: string
  label: string
}

export interface VotingOption {
  key: string
  label: string
  text: string
  votes: number
  rate: number
}

export interface VotingRateQuestion {
  value: string
  number: string
  text: string
  participantCount: number
  options: VotingOption[]
}
