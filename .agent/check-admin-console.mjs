// npm install --prefix .agent/browser-tools --no-save playwright axe-core
// Run with the default UI at :3002 and monitoring-enabled UI at :3003.
import { chromium } from './browser-tools/node_modules/playwright/index.mjs'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const require = createRequire(import.meta.url)
const axe = require.resolve('./browser-tools/node_modules/axe-core/axe.min.js')
const root = new URL('../', import.meta.url).pathname
const screenshots = `${root}docs/screenshots/admin-console`
await mkdir(screenshots, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []
const errors = []
const manager = { email: 'admin@example.test', googleSub: 'fixture-admin', accessSource: 'ENVIRONMENT_ACCESS', permissions: ['MANAGEMENT_PAGE_VIEW', 'ACCESS_REQUEST_APPROVE', 'MANAGEMENT_ACCESS_REVOKE'], expiresAt: new Date(Date.now() + 8 * 3600_000).toISOString() }
const request = { id: 42, email: 'event-team@example.test', status: 'PENDING', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 20 * 60_000).toISOString(), cancelledAt: null, cancellationReason: null, decidedAt: null }
const accounts = [
  { id: null, email: manager.email, source: 'ENVIRONMENT_ACCESS', active: true },
  { id: 'fixture-active', email: 'team-member@example.test', source: 'MANAGEMENT_ACCESS', active: true },
  { id: 'fixture-revoked', email: 'former-member@example.test', source: 'MANAGEMENT_ACCESS', active: false },
]
let session = manager
let requests = [request]
let mutations = 0
let accountCalls = 0
let accountFailure = false
let monitoringFailure = 0
let monitoringState = 'unconfigured'
let condition = 'unknown'
let stale = false
let probeFailure = false
let exchangeCalls = 0
let applyCalls = 0
let ownRequest = null
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 })
await context.route('**/api/**', async (route) => {
  const path = new URL(route.request().url()).pathname
  const json = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
  if (path === '/api/admin/auth/session') return json(session ?? { error: 'Authentication is required' }, session ? 200 : 401)
  if (path === '/api/admin/access-requests') return json(requests)
  if (path === '/api/admin/allowed-emails') { accountCalls++; return accountFailure ? json({ error: 'unavailable' }, 503) : json(accounts) }
  if (path === '/api/admin/access-request') {
    if (route.request().method() === 'POST') { applyCalls++; ownRequest = request }
    return ownRequest ? json(ownRequest) : route.fulfill({ status: 204 })
  }
  if (path === '/api/admin/auth/exchange') { exchangeCalls++; session = manager; return route.fulfill({ status: 204 }) }
  if (path.endsWith('/approve') || path.endsWith('/reject')) { mutations++; requests = []; return json({ ...request, status: path.endsWith('/approve') ? 'APPROVED' : 'REJECTED' }) }
  if (path === '/api/admin/auth/logout') { mutations++; session = null; return route.fulfill({ status: 204 }) }
  if (path === '/api/admin/service-health' && probeFailure) return json({ error: 'failed' }, 503)
  if (path === '/api/admin/monitoring') {
    if (monitoringFailure) return json({ error: 'failed' }, monitoringFailure)
    return json({ sources: ['statuspage', 'datadog'].map(provider => ({ provider, state: monitoringState, condition, stale, fetchedAt: monitoringState === 'ready' ? new Date().toISOString() : null, updatedAt: monitoringState === 'ready' ? new Date().toISOString() : null, metrics: { errorRatePercent: null, responseTimeMs: null, windowLabel: null } })) })
  }
  return route.continue()
})
const page = await context.newPage()
page.on('pageerror', error => errors.push(error.message))
async function visit(path, origin = 'http://127.0.0.1:3002') {
  await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' })
  await page.locator('.admin-console h1').waitFor()
}
async function check(label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  assert.equal(overflow, false, `${label}: horizontal overflow`)
  await page.addScriptTag({ path: axe })
  const report = await page.evaluate(async () => window.axe.run(document.querySelector('.admin-console'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }))
  assert.deepEqual(report.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], `${label}: accessibility`)
  results.push({ label, axeViolations: report.violations.length, horizontalOverflow: overflow })
}
try {
  for (const [name, path] of [['main', '/admin'], ['logs', '/admin/logs'], ['status', '/admin/status'], ['permissions', '/admin/permissions'], ['logout', '/admin/logout']]) {
    await visit(path)
    await check(`${name}-desktop`)
    await page.screenshot({ path: `${screenshots}/${name}-desktop.png`, fullPage: true })
    await page.setViewportSize({ width: 390, height: 844 })
    await check(`${name}-mobile`)
    await page.screenshot({ path: `${screenshots}/${name}-mobile.png`, fullPage: true })
    await page.setViewportSize({ width: 1440, height: 1100 })
  }
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const path of ['/admin', '/admin/logs', '/admin/status', '/admin/permissions', '/admin/logout']) {
      await visit(path)
      await check(`${path}-${width}px`)
    }
  }
  await page.setViewportSize({ width: 1440, height: 1100 })
  await visit('/admin')
  await page.locator('.console-skip').focus()
  await page.keyboard.press('Enter')
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'console-content')
  await page.getByRole('link', { name: 'ログ確認', exact: true }).click()
  await page.waitForURL('**/admin/logs').catch(async (cause) => { console.error({ url: page.url(), text: await page.locator('body').innerText(), errors }); throw cause })
  await page.locator('.admin-console h1').waitFor()
  assert.equal(await page.locator('.admin-console h1').innerText(), '運営の記録を、ひとつに。')
  await page.goBack({ waitUntil: 'networkidle' })
  assert.equal(new URL(page.url()).pathname, '/admin')

  await visit('/admin/permissions')
  await page.getByRole('button', { name: `${request.email} の申請を承認`, exact: true }).click()
  assert.equal(mutations, 0)
  await page.getByRole('dialog').waitFor()
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), '戻る')
  await check('approval-dialog')
  await page.getByRole('dialog').getByRole('button', { name: '戻る', exact: true }).focus()
  await page.keyboard.press('Shift+Tab')
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), '承認する')
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('dialog').evaluate(el => el.open), false)
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), `${request.email} の申請を承認`)
  await page.getByRole('button', { name: `${request.email} の申請を承認`, exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: '承認する', exact: true }).click()
  await page.getByText('申請を承認しました。申請者は同じブラウザから管理画面へ進めます。').waitFor()
  assert.equal(mutations, 1)
  await page.getByText('承認待ちの申請はありません', { exact: true }).waitFor()

  accountFailure = true
  await page.getByRole('button', { name: '一覧を更新' }).click()
  await page.getByRole('alert').waitFor()
  assert.equal(await page.locator('.table-email').count(), 0)
  await check('account-fetch-error')
  accountFailure = false
  await page.getByRole('button', { name: '一覧を更新' }).click()
  await page.locator('.table-email').first().waitFor()

  await visit('/admin/status')
  await page.getByRole('button', { name: '疎通を確認' }).click()
  await page.getByText('疎通成功', { exact: true }).waitFor()
  await check('real-local-health-success')
  probeFailure = true
  await page.getByRole('button', { name: '疎通を確認' }).click()
  await page.getByRole('alert').waitFor()
  assert.equal(await page.getByText('疎通成功', { exact: true }).count(), 0)
  await check('local-probe-failure')
  probeFailure = false

  for (const state of ['unconfigured', 'unauthenticated', 'forbidden', 'error', 'ready']) {
    monitoringState = state
    condition = state === 'ready' ? 'partial_outage' : 'unknown'
    await visit('/admin/status', 'http://127.0.0.1:3003')
    await check(`monitoring-${state}`)
    if (state === 'ready') await page.screenshot({ path: `${screenshots}/status-partial-outage-fixture.png`, fullPage: true })
  }
  condition = 'operational'
  stale = true
  await visit('/admin/status', 'http://127.0.0.1:3003')
  assert.equal(await page.locator('.badge.positive').count(), 0)
  await check('monitoring-stale-success')
  for (const failure of [403, 503]) {
    monitoringFailure = failure
    await visit('/admin/status', 'http://127.0.0.1:3003')
    await page.getByRole('alert').waitFor()
    assert.equal(await page.locator('.provider-card').count(), 0)
    await check(`monitoring-http-${failure}`)
  }
  monitoringFailure = 0

  session = { ...manager, permissions: ['MANAGEMENT_PAGE_VIEW'] }
  await visit('/admin/permissions')
  assert.equal(await page.getByRole('button', { name: `${request.email} の申請を承認`, exact: true }).count(), 0)
  await check('viewer-without-approval-permission')
  session = manager
  await visit('/admin/logout')
  assert.equal(mutations, 1)
  await page.getByRole('button', { name: '確認してログアウト' }).click()
  await page.waitForURL('**/admin/login')
  await page.locator('#login-title').waitFor()
  assert.equal(mutations, 2)
  const beforeUnauth = accountCalls
  await page.goto('http://127.0.0.1:3002/admin/permissions', { waitUntil: 'networkidle' })
  await page.waitForURL('**/admin/login')
  assert.equal(accountCalls, beforeUnauth)
  assert.equal(await page.locator('.admin-console').count(), 0)
  await page.getByRole('link', { name: '参加者トップへ' }).click()
  await page.waitForURL('http://127.0.0.1:3002/')

  session = { ...manager, accessSource: 'APPLICANT', permissions: [] }
  await page.goto('http://127.0.0.1:3002/admin/logs', { waitUntil: 'networkidle' })
  await page.waitForURL('**/admin/login')
  await page.getByRole('button', { name: '管理者へ利用を申請する' }).click()
  await page.getByText('あと一歩。承認をお待ちください。', { exact: true }).waitFor()
  assert.equal(applyCalls, 1)
  ownRequest = { ...request, status: 'APPROVED' }
  await page.getByRole('button', { name: '承認状況を確認する' }).click()
  await page.getByRole('button', { name: '管理ポータルへ進む', exact: true }).click()
  await page.waitForURL('**/admin')
  await page.locator('.admin-console h1').waitFor()
  assert.equal(exchangeCalls, 1)
  results.push({ label: 'navigation-dialog-approval-logout-auth-application-exchange', passed: true })
  assert.deepEqual(errors, [], 'browser runtime errors')
  await writeFile(`${root}.agent/admin-console-browser-results.json`, JSON.stringify({ results, runtimeErrors: errors, screenshotAccounts: 'Explicit synthetic fixtures; no credentials or production identities.' }, null, 2))
  console.log(JSON.stringify({ checks: results.length, runtimeErrors: errors, screenshots }, null, 2))
} finally { await browser.close() }
