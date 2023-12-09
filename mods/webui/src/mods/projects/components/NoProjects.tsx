import { ButtonProps } from '@supabase/ui/dist/cjs/components/Button/Button'
import { signOut } from 'next-auth/react'
import React from 'react'

import { userStore } from '@/mods/auth/hooks/useLoggedIn'
import { currentProjectStorage } from '@/mods/projects/components/current-project'
import { Empty } from '@/ui'

import { useCreationEditingProject } from './creation-editing'

export const NoProjects: React.FC<{ buttonProps?: ButtonProps }> = ({
  buttonProps,
}) => {
  const { open: onClick } = useCreationEditingProject()

  return (
    <Empty
      title="Oops! You haven’t created a Project yet."
      message="You haven’t created a Project yet. Use Projects to get started creating Providers, Numbers, Agents, and other resources for your organization."
      buttonProps={{
        text: 'New Project',
        onClick,
        ...buttonProps,
      }}
      cancelButtonProps={{
        text: 'Sign Out',
        onClick: () => {
          userStore.destroy()
          currentProjectStorage.destroy()
          signOut()
        },
      }}
    />
  )
}
