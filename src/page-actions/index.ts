'use client'
import { buttonVariants } from 'fumadocs-ui/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover'

import { createViewOptionsPopover } from './popover'

export type {
  PageActionGroup,
  PageActionId,
  PageActionLabels,
  PageActionLocale,
  PageActionToggles,
} from './core'
export type { ViewOptionsPopoverProps } from './popover'

/**
 * "Open" menu for `fumadocs-ui`, linking the page to its source and to AI tools.
 */
export const ViewOptionsPopover = createViewOptionsPopover({
  Popover,
  PopoverTrigger,
  PopoverContent,
  buttonVariants,
})
