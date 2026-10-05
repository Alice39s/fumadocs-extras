export const pageActionGroups = ['page', 'chat', 'desktop', 'agent'] as const

export type PageActionGroup = (typeof pageActionGroups)[number]

export type PageActionId =
  | 'github'
  | 'markdown'
  | 'scira'
  | 'perplexity'
  | 'grok'
  | 'chatgpt'
  | 'claude'
  | 'claude-desktop'
  | 'claude-code'
  | 'codex'
  | 'cursor'

/**
 * Turn menu groups or single items on and off. All of them are on by default, and the
 * setting of an item wins over the setting of its group.
 *
 * @example { desktop: false, cursor: true, grok: false }
 */
export type PageActionToggles = Partial<Record<PageActionGroup | PageActionId, boolean>>

export interface PageActionLabels extends Record<PageActionId, string> {
  /** Text of the trigger button */
  open: string
  /** Prompt sent to the AI tools, `{url}` is replaced with the page URL */
  prompt: string
}

export type PageActionLocale = 'en' | 'zh-CN' | 'zh-TW'

export const pageActionLabels: Record<PageActionLocale, PageActionLabels> = {
  'en': {
    'open': 'Open',
    'prompt': 'Read {url}, I want to ask questions about it.',
    'github': 'Open in GitHub',
    'markdown': 'View as Markdown',
    'scira': 'Open in Scira AI',
    'perplexity': 'Open in Perplexity',
    'grok': 'Open in Grok',
    'chatgpt': 'Open in ChatGPT',
    'claude': 'Open in Claude',
    'claude-desktop': 'Open in Claude Desktop',
    'claude-code': 'Open in Claude Code',
    'codex': 'Open in Codex',
    'cursor': 'Open in Cursor',
  },
  'zh-CN': {
    'open': '打开',
    'prompt': '阅读 {url}，我想询问相关问题。',
    'github': '在 GitHub 中打开',
    'markdown': '以 Markdown 查看',
    'scira': '在 Scira AI 中打开',
    'perplexity': '在 Perplexity 中打开',
    'grok': '在 Grok 中打开',
    'chatgpt': '在 ChatGPT 中打开',
    'claude': '在 Claude 中打开',
    'claude-desktop': '在 Claude 桌面版中打开',
    'claude-code': '在 Claude Code 中打开',
    'codex': '在 Codex 中打开',
    'cursor': '在 Cursor 中打开',
  },
  'zh-TW': {
    'open': '開啟',
    'prompt': '閱讀 {url}，我想詢問相關問題。',
    'github': '在 GitHub 中開啟',
    'markdown': '以 Markdown 檢視',
    'scira': '在 Scira AI 中開啟',
    'perplexity': '在 Perplexity 中開啟',
    'grok': '在 Grok 中開啟',
    'chatgpt': '在 ChatGPT 中開啟',
    'claude': '在 Claude 中開啟',
    'claude-desktop': '在 Claude 桌面版中開啟',
    'claude-code': '在 Claude Code 中開啟',
    'codex': '在 Codex 中開啟',
    'cursor': '在 Cursor 中開啟',
  },
}

export interface PageActionsOptions {
  /** URL of the page the prompts ask to read */
  pageUrl: string
  /** A URL to the raw Markdown/MDX content of page */
  markdownUrl?: string
  /** Source file URL on GitHub */
  githubUrl?: string
  items?: PageActionToggles
  labels: PageActionLabels
}

export interface PageAction {
  id: PageActionId
  group: PageActionGroup
  title: string
  href: string
  /** Show the icon on the trigger, picked from brands that stay legible at 10px */
  preview: boolean
}

/**
 * Build the enabled menu entries, split into non-empty groups in menu order.
 */
export function getPageActions({
  pageUrl,
  markdownUrl,
  githubUrl,
  items,
  labels,
}: PageActionsOptions): PageAction[][] {
  const q = labels.prompt.replaceAll('{url}', pageUrl)
  // lets Claude Code check out the docs repository next to the prompt
  const repo = githubUrl?.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/blob\/([^/]+)\//)

  const all: [PageActionId, PageActionGroup, string | undefined][] = [
    ['github', 'page', githubUrl],
    ['markdown', 'page', markdownUrl && withBasePath(markdownUrl)],
    ['scira', 'chat', `https://scira.ai/?${query({ q })}`],
    ['perplexity', 'chat', `https://www.perplexity.ai/search?${query({ q })}`],
    ['grok', 'chat', `https://grok.com/?${query({ q })}`],
    ['chatgpt', 'chat', `https://chatgpt.com/?${query({ prompt: q, hints: 'search' })}`],
    ['claude', 'chat', `https://claude.ai/new?${query({ q })}`],
    ['claude-desktop', 'desktop', `claude://claude.ai/new?${query({ q })}`],
    [
      'claude-code',
      'agent',
      `https://claude.ai/code/new?${query({ q, ...(repo && { repo: repo[1], branch: repo[2] }) })}`,
    ],
    ['codex', 'agent', `codex://new?${query({ prompt: q })}`],
    ['cursor', 'agent', `https://cursor.com/link/prompt?${query({ text: q })}`],
  ]

  const enabled = all.flatMap(([id, group, href]) =>
    href && (items?.[id] ?? items?.[group] ?? true)
      ? [{ id, group, href, title: labels[id], preview: previewIds.has(id) }]
      : [],
  )
  return pageActionGroups
    .map(group => enabled.filter(item => item.group === group))
    .filter(group => group.length > 0)
}

const previewIds = new Set<PageActionId>(['chatgpt', 'claude', 'cursor'])

function query(params: Record<string, string>) {
  return new URLSearchParams(params).toString()
}

function withBasePath(href: string) {
  // ignore external
  if (/^\w+:/.test(href) || href.startsWith('//')) return href

  // Vite replaces the full `import.meta.env.BASE_URL` expression, other bundlers leave `env` undefined
  // written without casts, as parentheses hide the expression from the replacement
  const basePath =
    typeof import.meta.env !== 'undefined' && typeof import.meta.env.BASE_URL === 'string'
      ? import.meta.env.BASE_URL.replace(/\/$/, '')
      : ''
  return basePath + href
}
