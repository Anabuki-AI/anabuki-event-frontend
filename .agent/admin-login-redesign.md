# Admin login redesign — reference-driven revision

## Scope / workspace

- Worktree: `frontend/.worktree/feat/admin-login-ui`, branch `feat/admin-login-ui`.
- Ran `git fetch origin` before work; retained all pre-existing uncommitted admin-auth implementation.
- Only this worktree was edited. No staging, commits, pushes, main edits, backend changes, or environment/credential changes.
- Primary scope: signed-out `/admin` and `/admin/login`. Their shared shell also surrounds application and management states, so those states were regression-tested. The management heading was changed as well to remove the explicitly unwanted phrase from every screen.
- This document supersedes the original sage/Q&A-card design description in `admin-login-ui.md`; the authentication contract there remains unchanged.

## Reference interpretation

Reference: user-provided `pi-clipboard-a78f509b-4d60-48fe-990d-7d97e171ae0c.png` (2930 × 1810).

The image attachment was not visually delivered by the model interface. Instead, local Apple Vision OCR with bounding boxes and AppKit pixel sampling was used to inspect its actual information and palette. The reproducible local inspection utility is `reference-inspect.swift`; it takes an image path as its argument. No reference image was uploaded externally or copied into application assets.

Findings:
- This is a screen-flow/wireframe, not a polished login screenshot: login/logout at left, administrator main in the center, and log viewing / API status / permission assignment at right.
- Labels include log operation, acting user, date/time; API availability, error rate, response time; user list and admin/operations accounts.
- Large separated rectangular groups create a clear parent/child information hierarchy and generous inter-group whitespace.
- Palette sampled from the reference: pale coral `#FFD1D0`, lavender `#E4E2FF`, peach `#FADBBB`, lime `#BDE570` / `#C5E980`, and blue `#4774FF`.
- The reference's small labels and flowchart density are NOT a typography standard to copy. The implemented page uses a clear Japanese type hierarchy and readable 12–14px supporting text / 16px body text.

Decision: preserve the idea of one management entry point and softly distinguished functional groups, not the raw flowchart. There are no backed log or monitoring controls in this implementation, so no fake API uptime, dummy activity log, disabled dashboard tabs, or nonfunctional permission-assignment links were added. The informational map describes the existing access-request, identity, and session functionality only.

## Implemented design

- Replaced edge-to-edge sage/white split and decorative floating Q/A cards with a framed management-console layout on a cool off-white canvas.
- Unified full-width header: ANABUKI / ADMIN CONSOLE wordmark, restrained admin-only badge, and participant-home link. Shared utility footer sits outside the panel.
- Lavender context panel, white authentication panel, subtle 24px outer corners, thin neutral borders, deep navy Japanese type, and restrained blue for real active steps/focus/actions.
- Coral, lime, and lavender icon tiles reinterpret the reference's group colors. The three informational rows are not links and do not imply unavailable routes.
- Context headline: **「大会を支える、管理の拠点。」**
- Login heading: **「管理者ログイン」**
- Supporting copy: 「チームのアクセスを、ひとつの場所で。クイズ大会の管理者ポータルです。」
- Form intro: 「Google アカウントでログインして、管理ポータルにアクセスします。」
- Management heading: **「管理ポータル」**. Removed the old unwanted headline from rendered source entirely.
- Three-step progress now says ログイン → 利用申請 → 管理画面. The existing help still explains that returning approved accounts skip application.
- Google identity mark and familiar white sign-in button preserved. First-visit guidance and expandable detailed help remain close to the action.
- Tablet/mobile: context panel collapses to a short heading, operational login remains prominent, no fake sidebar/drawer. Mobile link/security wording was shortened after screenshot OCR showed awkward wrapping. Desktop is still identified as the intended management device.
- No added app dependencies, external fonts, images, or global/participant CSS changes.

## Contract preservation

No changes to `admin-auth.ts`, `useAdminPortal.ts`, route alias, runtime configuration, proxy, or OAuth environment settings.

Preserved Google top-level navigation; configured/unconfigured status; loading and connection retry; callback error recovery; explicit application; 10-second pending polling; permission-controlled approval; explicit session exchange; rejected/cancelled/expired handling; duplicate-submit prevention; logout confirmation; HttpOnly cookies; focus movement; live regions; reduced-motion styling.

## Validation

All final checks passed:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: **25 passed**, 2 files.
- `pnpm build`: success, log at `ui-redesign-build.log` (ignored).
- `git diff --check`.
- `node .agent/browser-check.mjs`: built Nuxt + isolated contract-faithful mock API on ports 18080/18081, automatically stopped afterward.
  - `/admin` and `/admin/login`, Google link, OAuth redirect / multiple HttpOnly cookies / no-store and callback error recovery.
  - Loading state held deterministically until audit completes.
  - No horizontal overflow at **320 / 390 / 768 / 1024 / 1440px**; Google action remains at least 44px high.
  - Keyboard skip-link → main → Google action, expandable login help.
  - Unconfigured OAuth, service failure and retry, applicant → pending → approved → session exchange → management.
  - Approval confirmation, logout confirmation and cookie removal, rejected/cancelled states.
  - **13 state/viewport axe WCAG 2 A/AA + 2.1 AA audits: zero violations**. Initial low-contrast decorative row numbers were darkened and rechecked.
  - No browser runtime errors.
- Live dev server: `http://localhost:3000/admin` and `/admin/login` both HTTP 200. Fresh isolated Chromium context confirmed the revised 「管理者ログイン」 heading and visible Google sign-in link on the live server, without clicking through OAuth or using an existing user session.
- A real Google round-trip was not repeated; this task does not change its configuration or transport.

Current screenshots (production build, no real identities):
- `screenshots/login-desktop.png` — 1440px.
- `screenshots/login-mobile.png` — 390px.
- `screenshots/login-tablet.png` — 1024px.
- `screenshots/application-pending.png`.
- `screenshots/management-inbox.png`.

Browser report: `browser-report.json`. Screenshots were additionally inspected with local OCR/geometry and color sampling because the model interface did not render image attachments.

## Files changed in this revision

- `app/features/admin/components/AdminPortal.vue` — shell, contextual map, copy, scoped responsive styles; auth handlers preserved.
- `app/features/admin/components/PortalIcon.vue` — two small inline icon paths (`console`, `team`).
- `.agent/browser-check.mjs` — heading regression assertion, mobile accessibility/target size, tablet screenshot, deterministic loading audit, keyboard/help assertions.
- `.agent/browser-report.json`, `.agent/screenshots/*.png` — refreshed evidence.
- `.agent/reference-inspect.swift` — local reference/screenshot analysis utility.
- `.agent/admin-login-redesign.md` — this handoff.
- `.agent/admin-login-ui.md` — pointer to this newer design revision.

All changes remain uncommitted and unstaged. Previously existing worktree modifications are intentionally retained.
