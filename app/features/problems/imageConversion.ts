import { IMAGE_MAX_BYTES, IMAGE_SOURCE_MAX_BYTES, IMAGE_WEBP_QUALITY, IMAGE_MAX_DIMENSION } from './constants'

const WEBP_TYPE = 'image/webp'
const IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|gif|bmp|avif|svg|heic|heif|tiff?|ico|webp)$/i

export class ImageConversionError extends Error {}

/** 画像ファイルかどうか。type が空になるブラウザ(HEICなど)のため拡張子でも判定する。 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || (file.type === '' && IMAGE_EXTENSION_PATTERN.test(file.name))
}

function webpFileName(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, '') || 'image'
  return `${base}.webp`
}

async function decode(file: File): Promise<{ source: CanvasImageSource, width: number, height: number, close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() }
    } catch {
      // SVGなど createImageBitmap 非対応の形式は <img> でのデコードにフォールバックする
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} }
  } catch {
    throw new ImageConversionError('この画像は読み込めませんでした。別の形式の画像を選択してください')
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * 任意の画像をWEBPへ変換する。すでにWEBPならそのまま返す。
 * アニメーションGIFなどは先頭フレームのみが変換対象になる。
 */
export async function convertImageToWebp(file: File): Promise<File> {
  if (file.type === WEBP_TYPE) return file
  if (file.size > IMAGE_SOURCE_MAX_BYTES) throw new ImageConversionError('画像ファイルが大きすぎます')

  const decoded = await decode(file)
  try {
    if (!decoded.width || !decoded.height) throw new ImageConversionError('この画像は読み込めませんでした。別の形式の画像を選択してください')
    const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(decoded.width, decoded.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(decoded.width * scale))
    canvas.height = Math.max(1, Math.round(decoded.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new ImageConversionError('画像の変換に失敗しました')
    context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, WEBP_TYPE, IMAGE_WEBP_QUALITY))
    if (!blob || blob.type !== WEBP_TYPE) throw new ImageConversionError('お使いのブラウザではこの画像をWEBPへ変換できません')
    if (blob.size > IMAGE_MAX_BYTES) throw new ImageConversionError('変換後の画像ファイルが5MBを超えています。画像を小さくしてください')
    return new File([blob], webpFileName(file.name), { type: WEBP_TYPE })
  } finally {
    decoded.close()
  }
}
