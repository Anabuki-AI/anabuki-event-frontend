import { describe, expect, it } from 'vitest'
import { isProjectorAnswerVisible } from '~/features/projector/use-projector-quiz'
import type { OperatorQuizState } from '~/features/quiz-control/types'

const current = {
  question_id: 1, position: 1, question_text: 'Q', choices: { A: 'a', B: 'b', C: 'c', D: 'd' },
  image_url: null, correct_answer: 'B' as const, answered_count: 0, answered_rate: 0,
}
const base = (over: Partial<OperatorQuizState>): OperatorQuizState => ({
  status: 'in_progress', phase: 'answering', current, question_count: 3, total_participants: 5, ...over,
})

describe('isProjectorAnswerVisible', () => {
  it('hides the answer until revealed', () => {
    for (const phase of ['answering', 'closing', 'closed'] as const) {
      expect(isProjectorAnswerVisible(base({ phase }))).toBe(false)
    }
    expect(isProjectorAnswerVisible(null)).toBe(false)
    expect(isProjectorAnswerVisible(base({ current: null }))).toBe(false)
  })
  it('shows the answer once revealed', () => {
    expect(isProjectorAnswerVisible(base({ phase: 'revealed' }))).toBe(true)
  })
})
