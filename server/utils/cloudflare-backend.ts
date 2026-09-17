type BackendService = {
  fetch(request: Request): Promise<Response>
}

type CloudflareEventContext = {
  cloudflare?: {
    env?: {
      BACKEND?: BackendService
    }
  }
}

type RuntimeRequest = Pick<Request, 'url' | 'method' | 'headers' | 'body' | 'signal'>

type BackendEvent = {
  context?: unknown
  // h3's Node-compatible declaration is used at build time, while
  // cloudflare_module supplies a Web Request at runtime.
  req: unknown
}

/**
 * Nitro's cloudflare_module exposes the Worker environment at
 * event.context.cloudflare.env. Do not read it from event.req: that is the
 * incoming Web Request and has no runtime binding object.
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
 * Build a request for a Worker service binding without changing the browser's
 * Origin. Rails uses Origin for its same-origin guard, so it must remain the
 * public frontend origin rather than the internal service URL.
 *
 * The forwarded protocol is derived from the Worker request URL, not accepted
 * from a client-supplied X-Forwarded-Proto header. This keeps Rails' SSL
 * handling correct after the Worker-to-Worker/container hop.
 */
export function createBackendRequest(
  event: BackendEvent,
  target: URL,
  options: { forwardRequestHeaders?: boolean } = {},
) {
  const request = event.req as RuntimeRequest
  const headers = new Headers()
  if (options.forwardRequestHeaders) {
    for (const [name, value] of request.headers) {
      if (name !== 'connection' && name !== 'content-length') {
        headers.set(name, value)
      }
    }
  }

  headers.set('x-forwarded-proto', new URL(request.url).protocol.replace(':', ''))

  const methodHasBody = !['GET', 'HEAD'].includes(request.method)
  const requestInit = {
    method: request.method,
    headers,
    body: methodHasBody ? request.body : undefined,
    duplex: methodHasBody ? 'half' : undefined,
    redirect: 'manual' as RequestRedirect,
    signal: request.signal,
  } as RequestInit & { duplex?: 'half' }
  return new Request(target, requestInit)
}
