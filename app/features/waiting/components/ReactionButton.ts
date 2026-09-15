import type { ReactionOption } from '../types'

/**
 * リアクションボタンの定義(旧ReactionButton.vueのscript)。
 * テンプレートはpages/users/waiting.vueに統合済み。
 * 絵文字のみ表示。labelはスクリーンリーダー用のaria-labelに使う。
 */
export const reactionOptions: ReactionOption[] = [
  { emoji: '👏', label: '拍手' },
  { emoji: '🎉', label: 'わーい' },
  { emoji: '🙌', label: 'いつでも' },
  { emoji: '😂', label: '笑' },
  { emoji: '😢', label: 'かなしい' },
  { emoji: '😲', label: 'おどろき' },
  { emoji: '👍', label: 'いいね' },
  { emoji: '❤️', label: 'ありがとう' },
]
