import { ButtonProps } from '@supabase/ui/dist/cjs/components/Button/Button'
import React from 'react'

import { Empty } from '@/ui'

import { useCreationEditingDomain } from '../../components/creation-editing'

export const NoDomains: React.FC<{ buttonProps?: ButtonProps }> = ({
  buttonProps,
}) => {
  const { open: onClick } = useCreationEditingDomain()

  return (
    <Empty
      title="Oops! You haven’t created a Domain yet."
      message="Add to your Project a SIP Domain to group several SIP Agents. (e.g office, home, etc)"
      buttonProps={{
        text: 'New Domain',
        onClick,
        ...buttonProps,
      }}
    />
  )
}
