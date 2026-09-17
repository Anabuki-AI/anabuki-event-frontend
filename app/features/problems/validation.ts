import { ALLOWED_IMAGE_TYPES, IMAGE_MAX_BYTES, TIME_LIMIT_SECONDS_MAX } from './constants'

export function validateImageFile(file: File): string {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'WEBP形式の画像ファイルを選択してください'
  if (file.size > IMAGE_MAX_BYTES) return '画像ファイルは5MB以下にしてください'
  return ''
}

export function problemErrorMessage(statusCode: number | undefined, fallback: string): string {
  if (statusCode === 401) return 'ログインの有効期限が切れました。オペレーターまたは管理者として再度ログインしてください。'
  if (statusCode === 403) return '問題管理を行う権限がありません。オペレーター権限または管理者権限について、運営担当者へお問い合わせください。'
  if (statusCode === 404) return '指定された問題は見つかりませんでした。'
  if (statusCode === 422) return '入力内容を確認してください。'
  return fallback
}

/**
 * 制限時間(秒)の入力を検証する。空欄は「制限時間なし」として許可する。
 * 有効なら空文字列、無効なら理由を返す。
 */
export function validateTimeLimitInput(value: string): string {
  if (value.trim() === '') return ''
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) return '制限時間は整数の秒数で入力してください'
  if (numeric <= 0) return '制限時間は1秒以上で入力してください'
  if (numeric > TIME_LIMIT_SECONDS_MAX) return `制限時間は${TIME_LIMIT_SECONDS_MAX}秒以下で入力してください`
  return ''
}

/** 制限時間の入力文字列を送信用の値(秒 or null)に変換する。空欄は null(制限時間なし)。 */
export function parseTimeLimitInput(value: string): number | null {
  if (value.trim() === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.trunc(numeric) : null
}

export function validateMultiplierInput(value: string | number, min: number, max: number): string {
  const text = String(value)
  if (text.trim() === '') return '自信度倍率を入力してください'
  const numeric = Number(text)
  if (!Number.isFinite(numeric)) return '数値で入力してください'
  if (numeric < min || numeric > max) return `${min}〜${max}の範囲で入力してください`
  const decimals = text.split('.')[1]
  if (decimals != null && decimals.length > 2) return '小数点以下は2桁までで入力してください'
  return ''
}

export function validatePointsInput(value: string | number, min: number, max: number): string {
  const text = String(value).trim()
  if (text === '') return '配点を入力してください'
  if (!/^\d+$/.test(text)) return '整数で入力してください'
  const numeric = Number(text)
  if (numeric < min || numeric > max) return `${min}〜${max}の範囲で入力してください`
  return ''
}
