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

/** 回答前に自信度を一度だけ確定する。Lv.1ではサーバーが3択を返す。 */
export function confirmParticipantQuizConfidence(input: ConfirmParticipantQuizConfidenceInput): Promise<ParticipantQuizState> {
  return request<ParticipantQuizState>('/participant/quiz/confidence-level', {
    method: 'POST',
    body: input,
    credentials,
    retry: 0,
  })
}

/** 確定済みの自信度で公開中の問題へ解答を送信する。 */
export function submitParticipantQuizAnswer(input: SubmitParticipantQuizAnswerInput): Promise<SubmitParticipantQuizAnswerResult> {
  return request<SubmitParticipantQuizAnswerResult>('/participant/quiz/answers', {
    method: 'POST',
    body: input,
    credentials,
    retry: 0,
  })
}
