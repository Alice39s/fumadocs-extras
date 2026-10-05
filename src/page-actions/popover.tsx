import { usePathname } from 'fumadocs-core/framework'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import type { ComponentProps, ComponentType, ReactNode } from 'react'
import { Fragment, useMemo } from 'react'

import type { PageAction, PageActionLabels, PageActionLocale, PageActionToggles } from './core'
import { getPageActions, pageActionLabels } from './core'
import { pageActionIcons } from './icons'

export interface ViewOptionsPopoverProps extends ComponentProps<'button'> {
  /**
   * A URL to the raw Markdown/MDX content of page
   */
  markdownUrl?: string

  /**
   * Source file URL on GitHub
   */
  githubUrl?: string

  /**
   * The page URL the AI prompts ask to read.
   *
   * Defaults to the URL the reader is on, without query and hash (the router
   * pathname during server rendering). Set it when the site should hand out a
   * canonical URL instead.
   */
  pageUrl?: string

  /**
   * Turn menu groups or single items on and off. All of them are on by default, and the
   * setting of an item wins over the setting of its group.
   *
   * @example { desktop: false, cursor: true, grok: false }
   */
  items?: PageActionToggles

  /**
   * Built-in labels to use
   *
   * @defaultValue 'en'
   */
  locale?: PageActionLocale

  /**
   * Override single labels of the chosen locale
   */
  labels?: Partial<PageActionLabels>
}

export interface PopoverPrimitives {
  Popover: ComponentType<{ children?: ReactNode }>
  PopoverTrigger: ComponentType<ComponentProps<'button'>>
  PopoverContent: ComponentType<{
    align?: 'start' | 'center' | 'end'
    className?: string
    children?: ReactNode
  }>
  buttonVariants: (options: { variant: 'secondary'; size: 'sm' }) => string
}

export function createViewOptionsPopover({
  Popover,
  PopoverTrigger,
  PopoverContent,
  buttonVariants,
}: PopoverPrimitives): (props: ViewOptionsPopoverProps) => ReactNode {
  return function ViewOptionsPopover({
    markdownUrl,
    githubUrl,
    pageUrl: pageUrlProp,
    items,
    locale = 'en',
    labels: labelsProp,
    className,
    children,
    ...props
  }: ViewOptionsPopoverProps): ReactNode {
    const pathname = usePathname()
    const labels = useMemo(
      () => ({ ...pageActionLabels[locale], ...labelsProp }),
      [locale, labelsProp],
    )
    const groups = useMemo(
      () =>
        getPageActions({
          pageUrl:
            pageUrlProp ??
            (typeof window === 'undefined'
              ? pathname
              : window.location.origin + window.location.pathname),
          markdownUrl,
          githubUrl,
          items,
          labels,
        }),
      [pageUrlProp, pathname, markdownUrl, githubUrl, items, labels],
    )

    return (
      <Popover>
        <PopoverTrigger
          {...props}
          className={[
            buttonVariants({ variant: 'secondary', size: 'sm' }),
            // Radix marks the open trigger with `data-state`, Base UI with `data-popup-open`
            'gap-2 data-[state=open]:bg-fd-accent data-[state=open]:text-fd-accent-foreground data-popup-open:bg-fd-accent data-popup-open:text-fd-accent-foreground',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {children ?? (
            <>
              {labels.open}
              <span aria-hidden="true" className="flex -space-x-1">
                {groups.flat().map(
                  item =>
                    item.preview && (
                      <span
                        key={item.id}
                        className="flex size-4 items-center justify-center rounded-full border bg-fd-background text-fd-muted-foreground [&_svg]:size-2.5"
                      >
                        {pageActionIcons[item.id]}
                      </span>
                    ),
                )}
              </span>
            </>
          )}
          <ChevronDown className="size-3.5 text-fd-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="flex flex-col gap-0.5 p-1">
          {groups.map((group, i) => (
            <Fragment key={group[0]!.group}>
              {i > 0 && <hr className="mx-2 my-1 shrink-0 border-fd-border" />}
              {group.map(item => (
                <ViewOption key={item.id} {...item} />
              ))}
            </Fragment>
          ))}
        </PopoverContent>
      </Popover>
    )
  }
}

function ViewOption({ id, title, href }: PageAction) {
  return (
    <a
      href={href}
      rel="noreferrer noopener"
      target="_blank"
      className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground focus-visible:bg-fd-accent focus-visible:text-fd-accent-foreground focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className="shrink-0 text-fd-muted-foreground transition-colors group-hover:text-current group-focus-visible:text-current [&_svg]:size-4"
      >
        {pageActionIcons[id]}
      </span>
      {title}
      <ArrowUpRight
        aria-hidden="true"
        className="ms-auto size-3.5 shrink-0 text-fd-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      />
    </a>
  )
}
