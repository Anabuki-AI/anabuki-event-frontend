import { describe, expect, it } from 'vitest'
import {
  getParticipantQuizScreen,
  isParticipantQuizFinishedState,
  isParticipantQuizWaitingState,
} from '~/features/participant-quiz/composables/use-participant-quiz-answer'
import type { ParticipantQuizState } from '~/features/participant-quiz/types'

const question = {
  question_id: 12,
  position: 2,
  question_text: '問題文',
  choices: { A: '選択肢A', B: '選択肢B', C: '選択肢C', D: '選択肢D' },
  image_url: null,
}

const inProgress: ParticipantQuizState = {
  status: 'in_progress',
  phase: 'answering',
  question,
  answered: false,
  my_answer: null,
  correct_answer: null,
}

describe('参加者クイズの画面遷移状態', () => {
  it('waiting・問題未定は待機画面へ戻す', () => {
    expect(isParticipantQuizWaitingState({ status: 'waiting', phase: null, question: null, answered: false, my_answer: null, correct_answer: null })).toBe(true)
    expect(isParticipantQuizWaitingState({ ...inProgress, question: null, phase: null })).toBe(true)
  })

  it('出題中・締切・解答発表中の問題は解答画面で扱う', () => {
    expect(isParticipantQuizWaitingState(inProgress)).toBe(false)
    expect(isParticipantQuizWaitingState({ ...inProgress, phase: 'closed' })).toBe(false)
    expect(isParticipantQuizWaitingState({ ...inProgress, phase: 'revealed', correct_answer: 'B' })).toBe(false)
  })

  it('finishedはrevealedでも待機画面へ遷移させず終了画面にする', () => {
    const finished: ParticipantQuizState = { ...inProgress, status: 'finished', phase: null, question: null, correct_answer: 'B' }

    expect(isParticipantQuizFinishedState(finished)).toBe(true)
    expect(isParticipantQuizWaitingState(finished)).toBe(false)
    expect(getParticipantQuizScreen(finished, false)).toBe('finished')
  })

  it('answering中は未解答なら解答フォーム、解答済みなら送信済み画面', () => {
    expect(getParticipantQuizScreen(inProgress, false)).toBe('answer')
    expect(getParticipantQuizScreen({ ...inProgress, answered: true, my_answer: { choice: 'A', confidence_level: 'normal' } }, false)).toBe('submitted')
    expect(getParticipantQuizScreen(inProgress, false, 12)).toBe('submitted')
  })

  it('phase=closed/revealedはそれぞれ締切・結果画面', () => {
    expect(getParticipantQuizScreen({ ...inProgress, phase: 'closed' }, false)).toBe('closed')
    expect(getParticipantQuizScreen({ ...inProgress, phase: 'revealed', correct_answer: 'B' }, false)).toBe('revealed')
  })
})
