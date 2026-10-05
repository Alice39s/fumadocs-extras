import './tailwind.css'
import { FrameworkProvider } from 'fumadocs-core/framework'
import type { ComponentType, ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { page, userEvent } from 'vite-plus/test/browser/context'
import { cleanup, render } from 'vitest-browser-react'

import type { ViewOptionsPopoverProps } from '../src/page-actions/popover'

const entries: [
  string,
  () => Promise<{ ViewOptionsPopover: ComponentType<ViewOptionsPopoverProps> }>,
][] = [
  ['fumadocs-ui', () => import('../src/page-actions/index')],
  ['@fumadocs/base-ui', () => import('../src/page-actions/base-ui')],
]

const props: ViewOptionsPopoverProps = {
  markdownUrl: '/docs/intro.mdx',
  githubUrl: 'https://github.com/acme/docs/blob/main/content/docs/intro.mdx',
}

const allTitles = [
  'Open in GitHub',
  'View as Markdown',
  'Open in Scira AI',
  'Open in Perplexity',
  'Open in Grok',
  'Open in ChatGPT',
  'Open in Claude',
  'Open in Claude Desktop',
  'Open in Claude Code',
  'Open in Codex',
  'Open in Cursor',
]

function Providers({ children }: { children: ReactNode }) {
  return (
    <FrameworkProvider
      usePathname={() => '/docs/intro'}
      useParams={() => ({})}
      useRouter={() => ({ push() {}, refresh() {} })}
    >
      {children}
    </FrameworkProvider>
  )
}

function html(el: Element | null | undefined): HTMLElement {
  if (!(el instanceof HTMLElement))
    throw new TypeError(`expected an HTML element, got ${el?.nodeName}`)
  return el
}

const link = (name: string) => page.getByRole('link', { name, exact: true })

function anchor(name: string): HTMLAnchorElement {
  const el = link(name).element()
  if (!(el instanceof HTMLAnchorElement)) throw new TypeError(`${name} is not a link`)
  return el
}

const query = (name: string, key: string) => new URL(anchor(name).href).searchParams.get(key)

const marks = (el: Element) => el.querySelectorAll('span[aria-hidden="true"] > span').length

/** Menu content in DOM order, `|` marks a separator */
function readMenu() {
  return [...html(anchor('Open in GitHub').parentElement).children].map(el =>
    el.tagName === 'HR' ? '|' : html(el).innerText.trim(),
  )
}

function rowStyle(name: string) {
  const el = anchor(name)
  return {
    bg: getComputedStyle(el).backgroundColor,
    color: getComputedStyle(el).color,
    icon: getComputedStyle(html(el.querySelector('span'))).color,
    arrow: getComputedStyle(el.querySelector(':scope > svg')!).opacity,
  }
}

const settle = () => new Promise(resolve => setTimeout(resolve, 350))

afterEach(() => cleanup())

describe.each(entries)('ViewOptionsPopover from %s', (_, load) => {
  async function mount(extra: ViewOptionsPopoverProps = {}) {
    const { ViewOptionsPopover } = await load()
    await render(<ViewOptionsPopover {...props} {...extra} />, { wrapper: Providers })
    return page.getByRole('button', { name: extra.labels?.open ?? 'Open', exact: true })
  }

  it('renders a trigger named by its text with three brand marks', async () => {
    const trigger = await mount()
    await expect.element(trigger).toBeVisible()
    const el = trigger.element()
    expect(marks(el)).toBe(3)
    expect(el.className).not.toContain('undefined')
    expect(el.getBoundingClientRect().height).toBeLessThan(40)
  })

  it('opens a grouped menu with every item', async () => {
    const trigger = await mount()
    await trigger.click()
    await expect.element(link('Open in Cursor')).toBeVisible()

    expect(readMenu()).toEqual([
      'Open in GitHub',
      'View as Markdown',
      '|',
      'Open in Scira AI',
      'Open in Perplexity',
      'Open in Grok',
      'Open in ChatGPT',
      'Open in Claude',
      '|',
      'Open in Claude Desktop',
      '|',
      'Open in Claude Code',
      'Open in Codex',
      'Open in Cursor',
    ])
    for (const title of allTitles) {
      const el = anchor(title)
      expect(el.target).toBe('_blank')
      expect(el.rel).toBe('noreferrer noopener')
      expect(el.querySelector('svg')!.getBoundingClientRect().width).toBeGreaterThan(0)
    }
    const separators = document.querySelectorAll('hr')
    expect(separators).toHaveLength(3)
    expect(separators[0]!.getBoundingClientRect().height).toBeGreaterThan(0)
  })

  it('names links by their text only', async () => {
    const trigger = await mount()
    await trigger.click()
    await expect.element(link('Open in ChatGPT')).toBeVisible()
    expect(page.getByRole('link').elements()).toHaveLength(allTitles.length)
    for (const el of page.getByRole('link').elements()) {
      expect(el.querySelector('title')).toBeNull()
      expect(el.querySelector('span')!.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('fills the page URL into the prompts', async () => {
    const trigger = await mount()
    await trigger.click()
    await expect.element(link('Open in Claude')).toBeVisible()
    expect(query('Open in Claude', 'q')).toBe(
      `Read ${location.origin}${location.pathname}, I want to ask questions about it.`,
    )
    expect(query('Open in Claude Code', 'repo')).toBe('acme/docs')
    expect(query('Open in Claude Code', 'branch')).toBe('main')
  })

  it('uses the pageUrl prop over the current location', async () => {
    const trigger = await mount({ pageUrl: 'https://docs.acme.dev/intro' })
    await trigger.click()
    await expect.element(link('Open in Claude')).toBeVisible()
    expect(query('Open in Claude', 'q')).toContain('https://docs.acme.dev/intro,')
  })

  it('applies the items toggles to the menu and the trigger', async () => {
    const trigger = await mount({
      items: { desktop: false, agent: false, cursor: true, grok: false },
    })
    expect(marks(trigger.element())).toBe(3)
    await trigger.click()
    await expect.element(link('Open in Cursor')).toBeVisible()
    expect(readMenu()).toEqual([
      'Open in GitHub',
      'View as Markdown',
      '|',
      'Open in Scira AI',
      'Open in Perplexity',
      'Open in ChatGPT',
      'Open in Claude',
      '|',
      'Open in Cursor',
    ])
  })

  it('drops trigger marks of hidden brands', async () => {
    const trigger = await mount({ items: { chat: false } })
    expect(marks(trigger.element())).toBe(1)
  })

  it('translates with the locale and labels props', async () => {
    const trigger = await mount({ locale: 'zh-CN', labels: { open: '问 AI' } })
    await trigger.click()
    await expect.element(link('在 Claude 桌面版中打开')).toBeVisible()
    expect(query('在 Claude 中打开', 'q')).toMatch(/^阅读 .+，我想询问相关问题。$/)
  })

  it('renders custom trigger children and forwards button props', async () => {
    const { ViewOptionsPopover } = await load()
    await render(
      <ViewOptionsPopover {...props} className="custom-trigger" aria-label="Page actions">
        Ask
      </ViewOptionsPopover>,
      { wrapper: Providers },
    )
    const trigger = page.getByRole('button', { name: 'Page actions' })
    await expect.element(trigger).toBeVisible()
    expect(trigger.element().className).toContain('custom-trigger')
    expect(trigger.element().textContent).toBe('Ask')
  })

  it('highlights the open trigger and closes on Escape', async () => {
    const trigger = await mount()
    const el = trigger.element()
    const idle = getComputedStyle(el).backgroundColor
    await trigger.click()
    await expect.element(link('Open in Claude')).toBeVisible()
    await settle()
    expect(getComputedStyle(el).backgroundColor).not.toBe(idle)
    await userEvent.keyboard('{Escape}')
    await expect.element(link('Open in Claude')).not.toBeInTheDocument()
  })

  it('shows the arrow and the full icon color on hover and keyboard focus', async () => {
    const trigger = await mount()
    await trigger.click()
    await expect.element(link('Open in Codex')).toBeVisible()
    await settle()
    const idle = rowStyle('Open in Codex')
    expect(idle.arrow).toBe('0')
    expect(idle.icon).not.toBe(idle.color)

    await link('Open in Codex').hover()
    await settle()
    const hover = rowStyle('Open in Codex')
    expect(hover.arrow).toBe('1')
    expect(hover.icon).toBe(hover.color)
    expect(hover.bg).not.toBe(idle.bg)

    await link('Open in Codex').unhover()
    anchor('Open in GitHub').focus()
    await userEvent.keyboard('{Tab}')
    await settle()
    const focused = html(document.activeElement)
    expect(focused.innerText.trim()).toBe('View as Markdown')
    expect(focused.matches(':focus-visible')).toBe(true)
    expect(rowStyle('View as Markdown').arrow).toBe('1')
  })

  it('keeps the menu inside the viewport', async () => {
    const trigger = await mount()
    await trigger.click()
    await expect.element(link('Open in Claude Code')).toBeVisible()
    await settle()
    const menu = html(anchor('Open in GitHub').parentElement).getBoundingClientRect()
    expect(menu.left).toBeGreaterThanOrEqual(0)
    expect(menu.right).toBeLessThanOrEqual(window.innerWidth)
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth)
  })
})
