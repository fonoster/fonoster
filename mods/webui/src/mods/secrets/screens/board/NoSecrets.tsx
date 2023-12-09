import { KeyIcon } from '@heroicons/react/outline'
import { ButtonProps } from '@supabase/ui/dist/cjs/components/Button/Button'
import React from 'react'

import { Empty } from '@/ui'

import { useCreationEditingSecret } from '../../components/creation-editing'

export const NoSecrets: React.FC<{ buttonProps?: ButtonProps }> = ({
  buttonProps,
}) => {
  const { open: onClick } = useCreationEditingSecret()

  return (
    <Empty
      title="Oops! You haven’t created a Secret yet."
      message="Encrypted secrets allow you to store sensitive information, such as access tokens, in your Project resources."
      buttonProps={{
        text: 'New Secret',
        onClick,
        ...buttonProps,
      }}
      icon={KeyIcon}
    />
  )
}
