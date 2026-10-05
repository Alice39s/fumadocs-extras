import { mkdir } from 'node:fs/promises'

import { chromium } from 'playwright'
import type { Page } from 'playwright'

const defaultMenu = [
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
]

const customMenu = [
  '在 GitHub 中打开',
  '以 Markdown 查看',
  '|',
  '在 Scira AI 中打开',
  '在 Perplexity 中打开',
  '在 ChatGPT 中打开',
  '在 Claude 中打开',
  '|',
  '在 Cursor 中打开',
]

const settle = (page: Page) => page.waitForTimeout(400)

function readMenu(page: Page) {
  return page.evaluate(() => {
    const popup = document.querySelector('a[href*="chatgpt.com"]')!.parentElement!
    const rect = popup.getBoundingClientRect()
    const separators = [...popup.querySelectorAll('hr')]
    return {
      items: [...popup.children].map(el =>
        el instanceof HTMLHRElement ? '|' : (el.textContent ?? '').trim(),
      ),
      left: rect.left,
      right: rect.right,
      separatorHeights: separators.map(hr => hr.getBoundingClientRect().height),
      iconSizes: [...popup.querySelectorAll('a > span[aria-hidden="true"] > svg')].map(svg => {
        const r = svg.getBoundingClientRect()
        return [r.width, r.height]
      }),
      scrollWidth: document.documentElement.scrollWidth,
    }
  })
}

/**
 * Check the default and the configured menu of an app, returns the number of failed checks.
 */
export async function checkApp(base: string, shots: string): Promise<number> {
  await mkdir(shots, { recursive: true })
  const browser = await chromium.launch()
  let failed = 0
  const check = (name: string, ok: boolean, detail: unknown) => {
    if (!ok) failed++
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${JSON.stringify(detail)}`)
  }

  for (const [scheme, width] of [
    ['light', 1100],
    ['dark', 1100],
    ['light', 390],
  ] as const) {
    console.log(`--- ${scheme} ${width}px`)
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: 2,
      colorScheme: scheme,
      reducedMotion: 'reduce',
      locale: 'en-US',
    })
    const page = await context.newPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })

    // default menu
    await page.goto(`${base}/docs`, { waitUntil: 'networkidle' })
    const dark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    check('theme follows the color scheme', dark === (scheme === 'dark'), dark)
    const trigger = page.getByRole('button', { name: 'Open', exact: true })
    const marks = await trigger.evaluate(el =>
      [...el.querySelectorAll('span[aria-hidden="true"] > span')].map(mark => {
        const r = mark.getBoundingClientRect()
        return [r.width, r.height, getComputedStyle(mark).marginInlineEnd]
      }),
    )
    check(
      'trigger shows three 16px marks',
      marks.length === 3 && marks.every(m => m[0] === 16 && m[1] === 16),
      marks,
    )
    // `-space-x-1` only exists in the app CSS when `fumadocs-extras/css/preset.css` is imported
    check(
      'preset CSS overlaps the marks',
      marks[0]?.[2] === '-4px' && marks[2]?.[2] === '0px',
      marks,
    )
    const idleBg = await trigger.evaluate(el => getComputedStyle(el).backgroundColor)

    await trigger.click()
    await page.getByRole('link', { name: 'Open in Cursor', exact: true }).waitFor()
    await settle(page)
    const menu = await readMenu(page)
    check(
      'menu lists every item in four groups',
      JSON.stringify(menu.items) === JSON.stringify(defaultMenu),
      menu.items,
    )
    check(
      'separators draw a 1px line',
      menu.separatorHeights.every(h => h === 1),
      menu.separatorHeights,
    )
    check(
      'icons are 16px',
      menu.iconSizes.length === 11 && menu.iconSizes.every(([w, h]) => w === 16 && h === 16),
      menu.iconSizes,
    )
    check('menu stays inside the viewport', menu.left >= 0 && menu.right <= width, [
      menu.left,
      menu.right,
    ])
    check('page has no horizontal scroll', menu.scrollWidth <= width, menu.scrollWidth)
    const openBg = await trigger.evaluate(el => getComputedStyle(el).backgroundColor)
    check('open trigger is highlighted', openBg !== idleBg, [idleBg, openBg])
    check(
      'links are named by their text',
      (await page.getByRole('link', { name: /^(Open in|View as) / }).count()) === 11,
      null,
    )

    const href = (name: string) =>
      page.getByRole('link', { name, exact: true }).getAttribute('href')
    const claude = new URL((await href('Open in Claude'))!)
    check(
      'prompt names the page URL',
      claude.searchParams.get('q') === `Read ${base}/docs, I want to ask questions about it.`,
      claude.searchParams.get('q'),
    )
    const code = new URL((await href('Open in Claude Code'))!)
    check(
      'Claude Code gets repository and branch',
      code.searchParams.get('repo') === 'acme/docs' && code.searchParams.get('branch') === 'main',
      code.search,
    )
    check(
      'Markdown link keeps its path',
      (await href('View as Markdown')) === '/docs.mdx',
      await href('View as Markdown'),
    )

    const row = page.getByRole('link', { name: 'Open in Codex', exact: true })
    const rowStyle = () =>
      row.evaluate(el => ({
        bg: getComputedStyle(el).backgroundColor,
        arrow: getComputedStyle(el.querySelector(':scope > svg')!).opacity,
      }))
    const idleRow = await rowStyle()
    await row.hover()
    await settle(page)
    const hoverRow = await rowStyle()
    check(
      'hover highlights the row and shows the arrow',
      idleRow.arrow === '0' && hoverRow.arrow === '1' && hoverRow.bg !== idleRow.bg,
      [idleRow, hoverRow],
    )

    if (width > 500) {
      await page.mouse.move(0, 0)
      await page.getByRole('link', { name: 'Open in Claude', exact: true }).hover()
      await settle(page)
      // the copy button, the trigger and the menu
      const box = await trigger.evaluate(el => {
        const popup = document.querySelector('a[href*="chatgpt.com"]')!.parentElement!
        const a = (el.previousElementSibling ?? el).getBoundingClientRect()
        const b = popup.getBoundingClientRect()
        return {
          x: a.left,
          y: a.top,
          right: Math.max(b.right, el.getBoundingClientRect().right),
          bottom: b.bottom,
        }
      })
      const pad = 24
      await page.screenshot({
        path: `${shots}/menu-${scheme}.png`,
        clip: {
          x: box.x - pad,
          y: box.y - pad,
          width: box.right - box.x + pad * 2 + 40,
          height: box.bottom - box.y + pad * 2,
        },
      })
    }

    await page.keyboard.press('Escape')
    await page
      .getByRole('link', { name: 'Open in Cursor', exact: true })
      .waitFor({ state: 'detached' })

    // configured menu, rendered from props a server component passes
    await page.goto(`${base}/docs/custom`, { waitUntil: 'networkidle' })
    const custom = page.getByRole('button', { name: '问 AI', exact: true })
    const customMarks = await custom.evaluate(
      el => el.querySelectorAll('span[aria-hidden="true"] > span').length,
    )
    check('configured trigger keeps three marks', customMarks === 3, customMarks)
    await custom.click()
    await page.getByRole('link', { name: '在 Cursor 中打开', exact: true }).waitFor()
    const configured = await readMenu(page)
    check(
      'items, locale and labels apply',
      JSON.stringify(configured.items) === JSON.stringify(customMenu),
      configured.items,
    )
    const zh = new URL(
      (await page
        .getByRole('link', { name: '在 Claude 中打开', exact: true })
        .getAttribute('href'))!,
    )
    check(
      'pageUrl prop names the page',
      zh.searchParams.get('q') === '阅读 https://docs.acme.dev/custom，我想询问相关问题。',
      zh.searchParams.get('q'),
    )

    check('no console errors', errors.length === 0, errors)
    await context.close()
  }

  await browser.close()
  return failed
}
