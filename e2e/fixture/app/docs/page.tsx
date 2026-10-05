import { DocsBody, DocsPage, DocsTitle, MarkdownCopyButton, ViewOptionsPopover } from '@/lib/ui'

export default function Page() {
  return (
    <DocsPage>
      <DocsTitle>Introduction</DocsTitle>
      <div className="flex flex-row items-center gap-2 border-b pb-6">
        <MarkdownCopyButton markdownUrl="/docs.mdx" />
        <ViewOptionsPopover
          markdownUrl="/docs.mdx"
          githubUrl="https://github.com/acme/docs/blob/main/content/docs/index.mdx"
        />
      </div>
      <DocsBody>
        <p>Page actions fixture.</p>
      </DocsBody>
    </DocsPage>
  )
}
