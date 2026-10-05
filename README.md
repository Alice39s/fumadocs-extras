# fumadocs-extras

[![npm version][npm-version-src]][npm-version-href]
[![License][license-src]][license-href]

Extra components for [Fumadocs](https://fumadocs.dev) UI.

## Page actions

`ViewOptionsPopover` replaces the "Open" menu of Fumadocs page actions. The props are the same, so you only have to change the import. It adds:

- Four groups with separators between them: page source, web chats, desktop apps and coding agents.
- Perplexity, Grok, Claude Desktop, Claude Code and Codex, next to GitHub, Markdown, Scira AI, ChatGPT, Claude and Cursor.
- An `items` prop that turns groups or single items on and off.
- The repository and branch passed to Claude Code when `githubUrl` points to GitHub.
- The ChatGPT, Claude and Cursor marks on the trigger.
- Links named by their text only, with the brand icons hidden from screen readers.
- English, Simplified Chinese and Traditional Chinese labels.

![Page actions menu](https://raw.githubusercontent.com/Alice39s/fumadocs-extras/main/.github/assets/menu-light.png)

### Install

```bash
pnpm add fumadocs-extras
```

Requires `fumadocs-core` 16.10 or later, React 19.2 or later and Tailwind CSS v4.

Import the preset after the Fumadocs one, so Tailwind CSS generates the classes the menu uses:

```css
@import 'tailwindcss';
@import 'fumadocs-ui/css/neutral.css';
@import 'fumadocs-ui/css/preset.css';
@import 'fumadocs-extras/css/preset.css';
```

### Usage

Pick the entry that matches the package your app imports Fumadocs UI from:

| Your app imports from                                                                                  | Use                                    |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `fumadocs-ui` (including `@fumadocs/base-ui` installed under that name, as `create-fumadocs-app` does) | `fumadocs-extras/page-actions`         |
| `@fumadocs/base-ui`                                                                                    | `fumadocs-extras/page-actions/base-ui` |

```tsx
import { MarkdownCopyButton } from 'fumadocs-ui/layouts/docs/page'
import { ViewOptionsPopover } from 'fumadocs-extras/page-actions'

;<div className="flex flex-row items-center gap-2 border-b pb-6">
  <MarkdownCopyButton markdownUrl={markdownUrl} />
  <ViewOptionsPopover
    markdownUrl={markdownUrl}
    githubUrl={`https://github.com/${owner}/${repo}/blob/main/content/docs/${page.path}`}
  />
</div>
```

### Choose the items

All items are on by default. Turn off a group or an item with `items`. The setting of an item wins over the setting of its group:

```tsx
<ViewOptionsPopover
  markdownUrl={markdownUrl}
  githubUrl={githubUrl}
  items={{
    desktop: false, // hide a whole group
    agent: false,
    cursor: true, // an item wins over its group
    grok: false,
  }}
/>
```

| Group     | Items                                              |
| --------- | -------------------------------------------------- |
| `page`    | `github`, `markdown`                               |
| `chat`    | `scira`, `perplexity`, `grok`, `chatgpt`, `claude` |
| `desktop` | `claude-desktop`                                   |
| `agent`   | `claude-code`, `codex`, `cursor`                   |

`github` and `markdown` also need their URL props. Empty groups leave no separator behind.

### Labels

`locale` picks the built-in labels: `en` (default), `zh-CN` or `zh-TW`. `labels` overrides single labels:

```tsx
<ViewOptionsPopover locale="zh-CN" labels={{ open: '问 AI' }} />
```

| Key                                                                                                    | English                                       |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `open`                                                                                                 | Open                                          |
| `prompt`                                                                                               | Read {url}, I want to ask questions about it. |
| `github`                                                                                               | Open in GitHub                                |
| `markdown`                                                                                             | View as Markdown                              |
| `scira`, `perplexity`, `grok`, `chatgpt`, `claude`, `claude-desktop`, `claude-code`, `codex`, `cursor` | Open in Scira AI, Open in Perplexity, …       |

`{url}` in `prompt` is replaced with the page URL. All props are serializable, so a server component can pass them.

### Props

| Prop          | Type                                                        | Description                                                                           |
| ------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `markdownUrl` | `string`                                                    | URL of the raw Markdown/MDX content of the page. Vite apps get `BASE_URL` prefixed.   |
| `githubUrl`   | `string`                                                    | Source file URL on GitHub.                                                            |
| `pageUrl`     | `string`                                                    | Page URL the prompts ask to read. Defaults to the current URL without query and hash. |
| `items`       | `Partial<Record<PageActionGroup \| PageActionId, boolean>>` | Groups and items to show.                                                             |
| `locale`      | `'en' \| 'zh-CN' \| 'zh-TW'`                                | Built-in labels.                                                                      |
| `labels`      | `Partial<PageActionLabels>`                                 | Labels to override.                                                                   |
| `children`    | `ReactNode`                                                 | Replaces the trigger text and marks.                                                  |

Other props go to the trigger button.

## License

[MIT](./LICENSE.md) License © Alice39s

`ViewOptionsPopover` is based on the page actions of [Fumadocs](https://github.com/fuma-nama/fumadocs) by Fuma Nama, under the MIT License.

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/fumadocs-extras?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmx.dev/package/fumadocs-extras
[license-src]: https://img.shields.io/github/license/Alice39s/fumadocs-extras.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/Alice39s/fumadocs-extras/blob/main/LICENSE.md
