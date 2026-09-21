// Nested worktrees make OXC discover the outer checkout's missing .nuxt references.
// Explicit transform options isolate test execution without changing project config.
import { mergeConfig } from 'vitest/config'
import config from '../vitest.config.ts'

export default mergeConfig(config, { oxc: { tsconfig: false } })
