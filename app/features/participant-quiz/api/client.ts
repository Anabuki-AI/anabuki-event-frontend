import type {
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

/** 公開中の問題へ解答を送信する(同一問題への再送は上書き)。 */
export function submitParticipantQuizAnswer(input: SubmitParticipantQuizAnswerInput): Promise<SubmitParticipantQuizAnswerResult> {
  return request<SubmitParticipantQuizAnswerResult>('/participant/quiz/answers', {
    method: 'POST',
    body: input,
    credentials,
    retry: 0,
  })
}
