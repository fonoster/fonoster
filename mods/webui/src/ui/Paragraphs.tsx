import { Typography } from '@supabase/ui'
import { Props } from '@supabase/ui/dist/cjs/components/Typography/Text'
import React from 'react'

import { classes } from '@/mods/shared/helpers/classes'

type Paragraph = React.HTMLAttributes<HTMLParagraphElement> & {
  options?: Omit<Props, 'children'>
}
type Heading = React.HTMLAttributes<HTMLHeadingElement> & {
  level?: 1 | 2 | 3 | 4 | 5
}

export const Text: React.FC<Paragraph> = ({ className, options, ...props }) => (
  <Typography.Text {...options}>
    <p
      className={classes('text-gray-200 dark:text-gray-200', className)}
      {...props}
    />
  </Typography.Text>
)

export const WhiteText: React.FC<Paragraph> = ({ options, ...props }) => (
  <Typography.Text {...options}>
    <p {...props} />
  </Typography.Text>
)

export const Label: React.FC<Paragraph> = ({
  className,
  options,
  ...props
}) => (
  <Typography.Text {...options}>
    <p className={classes('sbui-formlayout__label', className)} {...props} />
  </Typography.Text>
)

export const Title: React.FC<Heading> = ({
  level = 2,
  children,
  className,
  style,
}) => <Typography.Title level={level} {...{ children, className, style }} />
