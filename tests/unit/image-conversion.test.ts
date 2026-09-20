import { afterEach, describe, expect, it, vi } from 'vitest'
import { ImageConversionError, convertImageToWebp, isImageFile } from '../../app/features/problems/imageConversion'
import { validateImageFile } from '../../app/features/problems/validation'

afterEach(() => vi.unstubAllGlobals())

function stubCanvas(blobType: string | null, size = 10) {
  vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 4000, height: 2000, close: vi.fn() })))
  const drawImage = vi.fn()
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage }),
    toBlob: (cb: (b: Blob | null) => void) => cb(blobType ? new Blob([new Uint8Array(size)], { type: blobType }) : null),
  }
  vi.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLElement)
  return canvas
}

describe('問題画像のWEBP変換', () => {
  it('PNG/JPEG/HEICなどimage/*を受け付ける', () => {
    expect(validateImageFile(new File(['x'], 'a.png', { type: 'image/png' }))).toBe('')
    expect(validateImageFile(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))).toBe('')
    expect(isImageFile(new File(['x'], 'a.heic', { type: '' }))).toBe(true)
    expect(validateImageFile(new File(['x'], 'a.txt', { type: 'text/plain' }))).not.toBe('')
  })

  it('WEBPはそのまま返す', async () => {
    const file = new File(['x'], 'a.webp', { type: 'image/webp' })
    expect(await convertImageToWebp(file)).toBe(file)
  })

  it('PNGをWEBPに変換し拡張子とサイズ上限(長辺2560)を適用する', async () => {
    const canvas = stubCanvas('image/webp')
    const out = await convertImageToWebp(new File(['x'], 'photo.png', { type: 'image/png' }))
    expect(out.type).toBe('image/webp')
    expect(out.name).toBe('photo.webp')
    expect(canvas.width).toBe(2560)
    expect(canvas.height).toBe(1280)
  })

  it('ブラウザがWEBP出力できない場合はエラー', async () => {
    stubCanvas('image/png')
    await expect(convertImageToWebp(new File(['x'], 'a.png', { type: 'image/png' }))).rejects.toBeInstanceOf(ImageConversionError)
  })

  it('変換後が5MBを超えたらエラー', async () => {
    stubCanvas('image/webp', 5 * 1024 * 1024 + 1)
    await expect(convertImageToWebp(new File(['x'], 'a.png', { type: 'image/png' }))).rejects.toBeInstanceOf(ImageConversionError)
  })
})
