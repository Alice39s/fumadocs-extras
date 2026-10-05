import { fileURLToPath } from 'node:url'

import { guardStaleBuild } from 'tsdown-stale-guard'
import { snapshotApiPerEntry } from 'tsnapi/vitest'
import { beforeAll, describe } from 'vite-plus/test'

const root = fileURLToPath(new URL('..', import.meta.url))

describe('api snapshot', () => {
  beforeAll(async () => {
    await guardStaleBuild({ root })
  })

  snapshotApiPerEntry(root)
})
