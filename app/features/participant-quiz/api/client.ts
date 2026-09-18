import type {
  ConfirmParticipantQuizConfidenceInput,
  ParticipantQuizState,
  SubmitParticipantQuizAnswerInput,
  SubmitParticipantQuizAnswerResult,
} from '../types'
import { request } from '~/lib/api/client'

const credentials = 'include' as const

/** participant_session Cookie を付けて、表示可能な現在の問題状態を取得する。 */
export function fetchParticipantQuizState(): Promise<ParticipantQuizState> {
  return request<ParticipantQuizState>('/participant/quiz/state', { credentials, retry: 0 })
}

/** 自信度を選択・更新する。Lv.1確定時は choice を渡して除外対象から外す。 */
export function confirmParticipantQuizConfidence(input: ConfirmParticipantQuizConfidenceInput): Promise<ParticipantQuizState> {
  return request<ParticipantQuizState>('/participant/quiz/confidence-level', {
    method: 'POST',
    body: input,
    credentials,
    retry: 0,
  })
}

/** 確定済みの自信度で問題へ解答を送信する。受付中は選択肢だけ再送・更新できる。 */
export function submitParticipantQuizAnswer(input: SubmitParticipantQuizAnswerInput): Promise<SubmitParticipantQuizAnswerResult> {
  return request<SubmitParticipantQuizAnswerResult>('/participant/quiz/answers', {
    method: 'POST',
    body: input,
    credentials,
    retry: 0,
  })
}
