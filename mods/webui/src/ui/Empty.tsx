import type { ButtonProps } from '@supabase/ui/dist/cjs/components/Button/Button'
import React from 'react'

import { Button, Container, Text, Title } from '@/ui'

import { EmptyIcon } from './svg'

interface Props {
  title: string
  message: string
  buttonProps?: ButtonProps & { text: string }
  cancelButtonProps?: ButtonProps & { text: string }
  icon?: (props: React.ComponentProps<'svg'>) => JSX.Element
}

export const Empty: React.FC<Props> = ({
  title,
  message,
  icon: Icon,
  buttonProps,
  cancelButtonProps,
}) => (
  <Container>
    <div className="max-w-xl mx-auto text-center">
      {Icon ? (
        <Icon className="text-white w-14 mx-auto mb-4" />
      ) : (
        <EmptyIcon className="w-14 mx-auto mb-4" />
      )}

      <Title level={3}>{title}</Title>
      <Text>{message}</Text>

      {buttonProps && (
        <div>
          {cancelButtonProps && (
            <Button type="secondary" className="mr-4" {...cancelButtonProps}>
              {cancelButtonProps.text}
            </Button>
          )}
          <Button {...buttonProps}>{buttonProps.text}</Button>
        </div>
      )}
    </div>
  </Container>
)
