import { describe, expect, it, vi } from 'vite-plus/test'

import type { PageActionsOptions } from '../src/page-actions/core'
import { getPageActions, pageActionGroups, pageActionLabels } from '../src/page-actions/core'

const base: PageActionsOptions = {
  pageUrl: 'https://example.com/docs/intro',
  markdownUrl: '/docs/intro.mdx',
  githubUrl: 'https://github.com/acme/docs/blob/main/content/docs/intro.mdx',
  labels: pageActionLabels.en,
}

const ids = (groups: ReturnType<typeof getPageActions>) => groups.map(g => g.map(item => item.id))
const hrefOf = (options: PageActionsOptions, id: string) =>
  getPageActions(options)
    .flat()
    .find(item => item.id === id)?.href
const read = (href: string | undefined) => Object.fromEntries(new URL(href!).searchParams)

describe('getPageActions', () => {
  it('lists every item in four groups by default', () => {
    expect(ids(getPageActions(base))).toEqual([
      ['github', 'markdown'],
      ['scira', 'perplexity', 'grok', 'chatgpt', 'claude'],
      ['claude-desktop'],
      ['claude-code', 'codex', 'cursor'],
    ])
    expect(getPageActions(base).map(g => g[0]!.group)).toEqual([...pageActionGroups])
  })

  it('drops source items without a URL', () => {
    const groups = getPageActions({ ...base, markdownUrl: undefined, githubUrl: undefined })
    expect(ids(groups)[0]).toEqual(['scira', 'perplexity', 'grok', 'chatgpt', 'claude'])
    expect(getPageActions({ ...base, markdownUrl: '', githubUrl: '' })).toHaveLength(3)
  })

  it('turns groups off and lets an item win over its group', () => {
    const groups = getPageActions({
      ...base,
      items: { desktop: false, agent: false, cursor: true, grok: false },
    })
    expect(ids(groups)).toEqual([
      ['github', 'markdown'],
      ['scira', 'perplexity', 'chatgpt', 'claude'],
      ['cursor'],
    ])
  })

  it('keeps items on when their toggle is undefined or true', () => {
    expect(ids(getPageActions({ ...base, items: {} }))).toEqual(ids(getPageActions(base)))
    expect(ids(getPageActions({ ...base, items: { chat: true, claude: true } }))).toEqual(
      ids(getPageActions(base)),
    )
  })

  it('removes empty groups so no separator is left behind', () => {
    const groups = getPageActions({ ...base, items: { page: false, chat: false, agent: false } })
    expect(ids(groups)).toEqual([['claude-desktop']])
    expect(
      getPageActions({ ...base, items: Object.fromEntries(pageActionGroups.map(g => [g, false])) }),
    ).toEqual([])
  })

  it('marks the brands shown on the trigger', () => {
    const preview = getPageActions(base)
      .flat()
      .filter(item => item.preview)
      .map(item => item.id)
    expect(preview).toEqual(['chatgpt', 'claude', 'cursor'])
  })

  it('builds the provider URLs with the encoded prompt', () => {
    const prompt = 'Read https://example.com/docs/intro, I want to ask questions about it.'

    expect(read(hrefOf(base, 'scira'))).toEqual({ q: prompt })
    expect(read(hrefOf(base, 'claude-desktop'))).toEqual({ q: prompt })
    expect(read(hrefOf(base, 'perplexity'))).toEqual({ q: prompt })
    expect(read(hrefOf(base, 'grok'))).toEqual({ q: prompt })
    expect(read(hrefOf(base, 'chatgpt'))).toEqual({ prompt, hints: 'search' })
    expect(read(hrefOf(base, 'claude'))).toEqual({ q: prompt })
    expect(read(hrefOf(base, 'codex'))).toEqual({ prompt })
    expect(read(hrefOf(base, 'cursor'))).toEqual({ text: prompt })

    expect(hrefOf(base, 'perplexity')).toMatch(/^https:\/\/www\.perplexity\.ai\/search\?/)
    expect(hrefOf(base, 'grok')).toMatch(/^https:\/\/grok\.com\/\?/)
    expect(hrefOf(base, 'chatgpt')).toMatch(/^https:\/\/chatgpt\.com\/\?/)
    expect(hrefOf(base, 'claude')).toMatch(/^https:\/\/claude\.ai\/new\?/)
    expect(hrefOf(base, 'claude-desktop')).toMatch(/^claude:\/\/claude\.ai\/new\?q=/)
    expect(hrefOf(base, 'codex')).toMatch(/^codex:\/\/new\?prompt=/)
    expect(hrefOf(base, 'cursor')).toMatch(/^https:\/\/cursor\.com\/link\/prompt\?/)
  })

  it('encodes characters that would break the query', () => {
    const href = hrefOf({ ...base, pageUrl: 'https://example.com/a?x=1&y=2#h' }, 'claude')
    expect(new URL(href!).searchParams.get('q')).toBe(
      'Read https://example.com/a?x=1&y=2#h, I want to ask questions about it.',
    )
  })

  it('passes repository and branch to Claude Code for GitHub sources', () => {
    const params = new URL(hrefOf(base, 'claude-code')!).searchParams
    expect(params.get('repo')).toBe('acme/docs')
    expect(params.get('branch')).toBe('main')
    expect(params.get('q')).toContain('https://example.com/docs/intro')
  })

  it('leaves repository out when the source is not a GitHub blob URL', () => {
    for (const githubUrl of [
      undefined,
      'https://gitlab.com/acme/docs/-/blob/main/a.mdx',
      'https://github.com/acme',
    ]) {
      const params = new URL(hrefOf({ ...base, githubUrl }, 'claude-code')!).searchParams
      expect([...params.keys()]).toEqual(['q'])
    }
  })

  it('uses the labels of the locale', () => {
    const groups = getPageActions({ ...base, labels: pageActionLabels['zh-CN'] })
    expect(groups.flat().find(item => item.id === 'claude')?.title).toBe('在 Claude 中打开')
    expect(
      new URL(hrefOf({ ...base, labels: pageActionLabels['zh-TW'] }, 'claude')!).searchParams.get(
        'q',
      ),
    ).toBe('閱讀 https://example.com/docs/intro，我想詢問相關問題。')
  })

  it('prefixes the Vite base path to the Markdown URL', () => {
    expect(hrefOf(base, 'markdown')).toBe('/docs/intro.mdx')
    vi.stubEnv('BASE_URL', '/site/')
    try {
      expect(hrefOf(base, 'markdown')).toBe('/site/docs/intro.mdx')
      expect(hrefOf(base, 'github')).toBe(base.githubUrl)
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('keeps external and protocol-relative Markdown URLs unchanged', () => {
    expect(hrefOf({ ...base, markdownUrl: 'https://cdn.example.com/a.md' }, 'markdown')).toBe(
      'https://cdn.example.com/a.md',
    )
    expect(hrefOf({ ...base, markdownUrl: '//cdn.example.com/a.md' }, 'markdown')).toBe(
      '//cdn.example.com/a.md',
    )
  })
})

describe('pageActionLabels', () => {
  it('translates every key in every locale', () => {
    const keys = Object.keys(pageActionLabels.en).toSorted()
    for (const labels of Object.values(pageActionLabels)) {
      expect(Object.keys(labels).toSorted()).toEqual(keys)
      expect(labels.prompt).toContain('{url}')
      for (const value of Object.values(labels)) expect(value.trim()).not.toBe('')
    }
  })
})
