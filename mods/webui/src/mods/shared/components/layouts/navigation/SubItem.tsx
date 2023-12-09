import Link from 'next/link'
import React from 'react'

import { classes } from '@/mods/shared/helpers/classes'

interface Props {
  href: string
  isActive: boolean
}

export const SubItem: React.FC<Props> = React.forwardRef<
  HTMLAnchorElement,
  Props
>(({ href, children, isActive, ...rest }, ref) => (
  <Link href={href}>
    <a
      ref={ref}
      {...rest}
      className={classes(
        'group w-full py-4 rounded-md flex flex-col font-medium hover:text-white',
        isActive ? 'text-white' : 'text-gray-200'
      )}
    >
      {children}
    </a>
  </Link>
))

SubItem.displayName = 'SubItem'
