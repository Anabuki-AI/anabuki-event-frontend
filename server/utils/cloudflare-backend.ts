type BackendService = {
  fetch(request: Request): Promise<Response>
}

type CloudflareEventContext = {
  cloudflare?: {
    env?: {
      BACKEND?: BackendService
      // Optional https origin of the Rails API reached through the
      // Cloudflare Tunnel (e.g. https://api.anabuki-event.com). When set it
      // takes precedence over the BACKEND service binding.
      NUXT_BACKEND_ORIGIN?: string
    }
  }
}

type RequestLike = {
  url?: unknown
  method?: unknown
  headers?: unknown
  body?: BodyInit | null
  signal?: AbortSignal
}

type BackendEvent = {
  context?: unknown
  // h3's request shape differs between the Node and Cloudflare adapters.
  // Keep this boundary runtime-shaped instead of casting it to a Web Request.
  req: unknown
  method?: string
  node?: {
    req?: unknown
  }
}

/**
 * Nitro's cloudflare_module exposes the Worker environment at
 * event.context.cloudflare.env. The request itself remains on event.req (or
 * event.node.req for the Node adapter); it is intentionally handled through
 * the small runtime-shaped boundary below.
 */
function cloudflareContext(event: BackendEvent) {
  return (event.context as CloudflareEventContext | undefined)?.cloudflare
}

export function isCloudflareRuntime(event: BackendEvent) {
  return cloudflareContext(event)?.env !== undefined
}

export function getCloudflareBackend(event: BackendEvent) {
  return cloudflareContext(event)?.env?.BACKEND
}

/**
 * https origin of the Rails API behind the Cloudflare Tunnel, when the Worker
 * is configured to reach it over the public hostname instead of a service
 * binding. Only https origins are honored: the tunnel hostname terminates TLS
 * at the edge, so plain http would loop unencrypted traffic through the zone.
 */
export function getRemoteBackendOrigin(event: BackendEvent) {
  const origin = cloudflareContext(event)?.env?.NUXT_BACKEND_ORIGIN
  return typeof origin === 'string' && origin.startsWith('https://') ? origin : undefined
}

/** Copy either Web Request Headers or Node's plain header map into Web Headers. */
function copyRequestHeaders(source: unknown, target: Headers, { excludeHostHeader = false } = {}) {
  const skipNames = excludeHostHeader
    ? ['connection', 'content-length', 'host']
    : ['connection', 'content-length']
  if (source instanceof Headers) {
    source.forEach((value, name) => {
      if (!skipNames.includes(name.toLowerCase())) {
        target.set(name, value)
      }
    })
    return
  }

  if (source == null || typeof source !== 'object') return

  const iterableSource = source as { [Symbol.iterator]?: () => Iterator<unknown> }
  if (typeof iterableSource[Symbol.iterator] === 'function') {
    for (const entry of source as Iterable<unknown>) {
      if (!Array.isArray(entry) || entry.length < 2) continue
      const [name, value] = entry
      if (typeof name !== 'string' || value == null) continue
      if (!skipNames.includes(name.toLowerCase())) {
        target.set(name, Array.isArray(value) ? value.join(', ') : String(value))
      }
    }
    return
  }

  for (const [name, value] of Object.entries(source)) {
    if (value == null || skipNames.includes(name.toLowerCase())) continue
    target.set(name, Array.isArray(value) ? value.join(', ') : String(value))
  }
}

function asRequestLike(value: unknown): RequestLike {
  return value != null && typeof value === 'object' ? value as RequestLike : {}
}

/**
 * Build a request for a Worker service binding without changing the browser's
 * Origin. Rails uses Origin for its same-origin guard, so it must remain the
 * public frontend origin rather than the internal service URL.
 *
 * The forwarded protocol is derived from the incoming request URL, not
 * accepted from a client-supplied X-Forwarded-Proto header. This keeps Rails'
 * SSL handling correct after the Worker-to-Worker/container hop.
 */
export function createBackendRequest(
  event: BackendEvent,
  target: URL,
  options: { forwardRequestHeaders?: boolean; forwardedProto?: string; excludeHostHeader?: boolean } = {},
) {
  const request = asRequestLike(event.req)
  const nodeRequest = asRequestLike(event.node?.req)
  const headers = new Headers()
  if (options.forwardRequestHeaders) {
    // H3's Node-compatible event uses an IncomingHttpHeaders object here,
    // while a native Worker Request exposes the iterable Headers class.
    copyRequestHeaders(request.headers ?? nodeRequest.headers, headers, {
      excludeHostHeader: options.excludeHostHeader,
    })
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
