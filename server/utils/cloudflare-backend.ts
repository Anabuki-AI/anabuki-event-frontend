type CloudflareEventContext = {
  cloudflare?: {
    env?: Record<string, unknown>
  }
}

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

const SPOOFABLE_REQUEST_HEADERS = new Set([
  ...HOP_BY_HOP_HEADERS,
  'forwarded',
  'host',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
])

type RequestLike = {
  url?: unknown
  method?: unknown
  headers?: unknown
  body?: BodyInit | null
  signal?: AbortSignal
}

type BackendEvent = {
  context?: unknown
  // H3's request shape differs between the Node and Cloudflare adapters.
  // Keep this boundary runtime-shaped instead of casting it to a Web Request.
  req: unknown
  method?: string
  node?: {
    req?: unknown
  }
}

/**
 * Nitro's cloudflare_module exposes the Worker environment at
 * event.context.cloudflare.env. The environment is used only to distinguish
 * the Worker runtime; the backend itself is reached through the configured
 * tunnel hostname, never a service binding.
 */
function cloudflareContext(event: BackendEvent) {
  return (event.context as CloudflareEventContext | undefined)?.cloudflare
}

export function isCloudflareRuntime(event: BackendEvent) {
  return cloudflareContext(event)?.env !== undefined
}

/** Copy either Web Request Headers or Node's plain header map into Web Headers. */
function copyRequestHeaders(source: unknown, target: Headers) {
  const copy = (name: unknown, value: unknown) => {
    if (typeof name !== 'string' || value == null) return
    const normalizedName = name.toLowerCase()
    if (SPOOFABLE_REQUEST_HEADERS.has(normalizedName)) return
    target.set(name, Array.isArray(value) ? value.filter(Boolean).join(', ') : String(value))
  }

  if (source instanceof Headers) {
    source.forEach((value, name) => copy(name, value))
    return
  }

  if (source == null || typeof source !== 'object') return

  const iterableSource = source as { [Symbol.iterator]?: () => Iterator<unknown> }
  if (typeof iterableSource[Symbol.iterator] === 'function') {
    for (const entry of source as Iterable<unknown>) {
      if (Array.isArray(entry) && entry.length >= 2) copy(entry[0], entry[1])
    }
    return
  }

  for (const [name, value] of Object.entries(source)) copy(name, value)
}

function asRequestLike(value: unknown): RequestLike {
  return value != null && typeof value === 'object' ? value as RequestLike : {}
}

/**
 * Build a request for the private backend origin without changing the browser's
 * Origin. Rails uses Origin for its same-origin guard, so it must remain the
 * public frontend origin rather than the upstream API hostname.
 *
 * The forwarded protocol is derived from the incoming request URL, not
 * accepted from a client-supplied X-Forwarded-Proto header. This keeps Rails'
 * SSL handling correct after the Worker-to-Worker/container hop.
 */
export function createBackendRequest(
  event: BackendEvent,
  target: URL,
  options: { forwardRequestHeaders?: boolean; forwardedProto?: string } = {},
) {
  const request = asRequestLike(event.req)
  const nodeRequest = asRequestLike(event.node?.req)
  const headers = new Headers()
  if (options.forwardRequestHeaders) {
    // H3's Node-compatible event uses an IncomingHttpHeaders object here,
    // while a native Worker Request exposes the iterable Headers class.
    copyRequestHeaders(request.headers ?? nodeRequest.headers, headers)
  }

  // The route passes the protocol parsed from h3's trusted getRequestURL(event)
  // result. The fallback keeps direct unit callers working without trusting a
  // client-supplied X-Forwarded-Proto header.
  const rawUrl = request.url ?? nodeRequest.url
  let requestUrl: URL
  try {
    requestUrl = new URL(String(rawUrl), target)
  }
  catch {
    requestUrl = target
  }
  headers.set(
    'x-forwarded-proto',
    options.forwardedProto ?? requestUrl.protocol.replace(':', ''),
  )

  const method = String(event.method ?? request.method ?? nodeRequest.method ?? 'GET').toUpperCase()
  const methodHasBody = !['GET', 'HEAD'].includes(method)
  const requestInit = {
    method,
    headers,
    body: methodHasBody ? request.body : undefined,
    duplex: methodHasBody ? 'half' : undefined,
    redirect: 'manual' as RequestRedirect,
    signal: request.signal,
  } as RequestInit & { duplex?: 'half' }
  return new Request(target, requestInit)
}

/**
 * Return only end-to-end response headers. In particular, do not relay
 * hop-by-hop headers from the tunnel origin, while preserving Set-Cookie for
 * the same-origin browser session.
 */
export function sanitizeBackendResponse(response: Response) {
  const headers = new Headers()
  response.headers.forEach((value, name) => {
    if (!HOP_BY_HOP_HEADERS.has(name)) headers.set(name, value)
  })

  const responseWithCookies = response.headers as Headers & { getSetCookie?: () => string[] }
  const cookies = responseWithCookies.getSetCookie?.()
  if (cookies?.length) {
    headers.delete('set-cookie')
    for (const cookie of cookies) headers.append('set-cookie', cookie)
  }

  headers.set('cache-control', 'no-store')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
