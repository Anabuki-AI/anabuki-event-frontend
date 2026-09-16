import { beforeEach, describe, expect, it, vi } from 'vitest'

// モック状態はモジュール内に持つため、各テスト前にリロードしてリセットする。
// リロードするとクラス身份が変わるため、QuizStateError も新モジュール側から受ける
beforeEach(async () => {
  await vi.resetModules()
})

async function freshMock() {
  return await import('../../app/features/quiz-control/mock')
}

describe('モッククイズ進行API', () => {
  it('初期状態は IDLE・未公開・3問登録', async () => {
    const mock = await freshMock()
    const state = await mock.mockFetchQuizState()

    expect(state.phase).toBe('IDLE')
    expect(state.currentQuestion).toBeNull()
    expect(state.totalQuestions).toBe(3)
  })

  it('start → publish → close → reveal → 次問題publish まで進む', async () => {
    const mock = await freshMock()

    const started = await mock.mockStartQuiz()
    expect(started.startedAt).not.toBeNull()

    const published = await mock.mockPublishQuestion()
    expect(published.phase).toBe('PUBLISHING')
    expect(published.currentQuestion?.id).toBe(1)

    const closed = await mock.mockCloseAnswers()
    expect(closed.phase).toBe('CLOSED')

    const revealed = await mock.mockRevealAnswer()
    expect(revealed.phase).toBe('REVEALED')
    expect(revealed.currentQuestion?.id).toBe(1)
    expect(revealed.nextQuestion?.id).toBe(2)

    const next = await mock.mockPublishQuestion()
    expect(next.phase).toBe('PUBLISHING')
    expect(next.currentQuestion?.id).toBe(2)
  })

  it('最終問題の答え表示後に publish すると「次の問題がありません」で409になる', async () => {
    const mock = await freshMock()
    // 3問すべて出題し切る
    await mock.mockStartQuiz()
    for (let i = 0; i < 3; i++) {
      await mock.mockPublishQuestion()
      await mock.mockCloseAnswers()
      await mock.mockRevealAnswer()
    }
    const ended = await mock.mockFetchQuizState()
    expect(ended.nextQuestion).toBeNull()

    const error = await mock.mockPublishQuestion().catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(mock.QuizStateError)
    expect((error as InstanceType<typeof mock.QuizStateError>).statusCode).toBe(409)
  })

  it('IDLEでいきなり close すると409になる', async () => {
    const mock = await freshMock()

    const error = await mock.mockCloseAnswers().catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(mock.QuizStateError)
    expect((error as InstanceType<typeof mock.QuizStateError>).statusCode).toBe(409)
  })
})
