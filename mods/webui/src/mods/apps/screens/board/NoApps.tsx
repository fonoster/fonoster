import { ButtonProps } from '@supabase/ui/dist/cjs/components/Button/Button'
import React from 'react'

import { Empty } from '@/ui'

import { useCreationEditingApp } from '../../components/creation-editing'

export const NoApps: React.FC<{ buttonProps?: ButtonProps }> = ({
  buttonProps,
}) => {
  const { open: onClick } = useCreationEditingApp()

  return (
    <Empty
      title="Oops! You haven’t created an Application yet."
      message="Your Fonoster Application will connect your Dialogflow ES/CX to your Telephony infrastructure."
      buttonProps={{
        text: 'New App',
        onClick,
        ...buttonProps,
      }}
    />
  )
}
