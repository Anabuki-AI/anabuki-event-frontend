import type { ParticipantReactionEmoji } from '~/features/participants/types'

export interface ProjectorReactionEvent {
  id: string
  reaction: ParticipantReactionEmoji
  reacted_at: string
}

export interface ProjectorReactionFeed {
  reactions: ProjectorReactionEvent[]
  /** 次回 since に渡す値 */
  cursor: string
}

/** 画面に浮かんでいる1個分。位置・軌道は生成時に乱数で決め、CSS変数として渡す。 */
export interface FloatingReaction {
  key: number
  emoji: ParticipantReactionEmoji
  /** 出現X位置(vw %) */
  left: number
  /** 上昇中の横揺れ幅(px、左右) */
  sway: number
  /** 最終的な横ずれ(px) */
  drift: number
  /** 絵文字サイズ(px) */
  size: number
  /** 継続時間(ms) */
  duration: number
  /** 表示開始までの遅延(ms)。まとめて届いた分を散らす */
  delay: number
}
