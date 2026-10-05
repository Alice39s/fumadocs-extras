import type { ReactNode } from 'react'

import { DocsLayout } from '@/lib/ui'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      nav={{ title: 'Fixture' }}
      tree={{
        name: 'Docs',
        children: [
          { type: 'page', name: 'Introduction', url: '/docs' },
          { type: 'page', name: 'Custom', url: '/docs/custom' },
        ],
      }}
    >
      {children}
    </DocsLayout>
  )
}
