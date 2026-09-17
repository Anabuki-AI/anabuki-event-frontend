import { ALLOWED_IMAGE_TYPES, IMAGE_MAX_BYTES } from './constants'

export function validateImageFile(file: File): string {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'PNG・JPEG・WEBP・GIFのいずれかの画像ファイルを選択してください'
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
