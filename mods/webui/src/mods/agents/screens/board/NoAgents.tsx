import { ButtonProps } from '@supabase/ui/dist/cjs/components/Button/Button'
import React from 'react'

import { useCreationEditingAgent } from '@/mods/agents/components/creation-editing'
import { Empty } from '@/ui'

export const NoAgents: React.FC<{ buttonProps?: ButtonProps }> = ({
  buttonProps,
}) => {
  const { open: onClick } = useCreationEditingAgent()

  return (
    <Empty
      title="Oops! You haven’t created a Agent yet."
      message="SIP Agents in the same Domain can call each other with Voice Over IP using a Software Phone (e.g Zoiper)"
      buttonProps={{
        text: 'New Agent',
        onClick,
        ...buttonProps,
      }}
    />
  )
}
