import { DocsBody, DocsPage, DocsTitle, ViewOptionsPopover } from '@/lib/ui'

export default function Page() {
  return (
    <DocsPage>
      <DocsTitle>Custom</DocsTitle>
      <div className="flex flex-row items-center gap-2 border-b pb-6">
        <ViewOptionsPopover
          markdownUrl="/docs/custom.mdx"
          githubUrl="https://github.com/acme/docs/blob/main/content/docs/custom.mdx"
          pageUrl="https://docs.acme.dev/custom"
          items={{ desktop: false, agent: false, cursor: true, grok: false }}
          locale="zh-CN"
          labels={{ open: '问 AI' }}
        />
      </div>
      <DocsBody>
        <p>Configured page actions.</p>
      </DocsBody>
    </DocsPage>
  )
}
