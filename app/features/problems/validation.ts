export function problemErrorMessage(statusCode: number | undefined, fallback: string): string {
  if (statusCode === 401) return 'ログインの有効期限が切れました。管理者として再度ログインしてください。'
  if (statusCode === 403) return '問題管理を行う権限がありません。管理者へお問い合わせください。'
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
