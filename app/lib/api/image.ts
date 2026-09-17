/**
 * API image fields are either legacy absolute URLs or paths relative to the
 * configured API base. Keep the conversion at the presentation boundary so
 * quiz APIs can return an authenticated, scoped image path.
 */
export function resolveApiImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl

  const config = useRuntimeConfig()
  return `${config.public.apiBase}${imageUrl}`
}
