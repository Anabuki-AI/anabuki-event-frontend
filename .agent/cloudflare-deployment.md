# Cloudflare deployment review/fix

## Confirmed implementation

- Nuxt 4.5.2/Nitro 2.13.4 uses `cloudflare_module` and builds `.output/server/index.mjs` plus `.output/public`.
- `wrangler.jsonc` now declares `assets.binding = "ASSETS"` and `assets.directory = "./.output/public"`. Nitro's generated Cloudflare handler calls `env.ASSETS.fetch()` for public asset paths; the previous config had no assets declaration, so `_nuxt/*` files were not deployed.
- The service binding is read from Nitro's actual `event.context.cloudflare.env.BACKEND` location, not `event.req.runtime`.
- `server/utils/cloudflare-backend.ts` preserves browser `Origin` and cookies for Rails same-origin/session behavior, removes framing/content-length headers for streamed requests, and overwrites client-supplied `X-Forwarded-Proto` using the Worker request URL.
- `server/api/[...path].ts` keeps manual redirects and returns a real frontend redirect for failed OAuth proxy responses. In Cloudflare it refuses to fall back to a public/base URL when the `BACKEND` binding is absent. h3 2.0.1-rc.26's proxy implementation uses `response.headers.getSetCookie()` and appends every cookie value.
- `server/api/admin/service-health.get.ts` uses the same binding in Cloudflare, does not forward cookies or Origin, and refuses a public fallback; local `$fetch` fallback remains.

## Verification evidence

- `mise exec -- pnpm install --frozen-lockfile`: exit 0, pnpm 10.15.0, Node 22.19.0.
- Before the asset fix, `mise exec -- pnpm build`: exit 0; generated 49 files under `.output/public`, including `_nuxt/*.js` and `.css`; generated worker source contained `env.ASSETS.fetch` but the manually-authored Wrangler config had no assets directory.
- Final `mise exec -- pnpm lint`: exit 0.
- Final `mise exec -- pnpm typecheck`: exit 0.
- Final `mise exec -- pnpm test`: exit 0; 35 files / 204 tests passed.
- Final `mise exec -- pnpm build`: exit 0; `.output/public` present with 49 files.
- Final `mise exec -- npx wrangler deploy --dry-run --config wrangler.jsonc`: exit 0; Wrangler read 52 assets and reported `env.ASSETS` plus `env.BACKEND (anabuki-event-backend)`.
- Official Nitro preset source inspected at `node_modules/nitropack/dist/presets/cloudflare/preset.mjs`: `publicDir = .output/public`, preview/deploy commands pass `--assets {{ output.publicDir }}`.
- Official Cloudflare Static Assets docs inspected: `assets.directory` is the upload directory and `binding` is the Worker `env` name.
- Wrangler schema inspected: `assets.directory` and `assets.binding` are valid.

## Official references consulted

- https://nitro.unjs.io/deploy/providers/cloudflare
- https://developers.cloudflare.com/workers/static-assets/binding/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/
- https://developers.cloudflare.com/workers/wrangler/configuration/
