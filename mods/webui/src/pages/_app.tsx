import * as React from 'react'
import { useState, useMemo } from 'react'
import type { Session } from '@toolpad/core/AppProvider'
import { useRouter } from 'next/router'
import LayoutProvider from '@/common/component/layout/LayoutProvider'
import MainLayout from '@/pages/workspace/layout'

export default function App({ Component }: { Component: React.ElementType }) {
  const router = useRouter()
  const isAuthPage =
    router.pathname === '/signin' ||
    router.pathname === '/signup' ||
    router.pathname === '/signup/verify' ||
    router.pathname === '/forgot-password' ||
    router.pathname === '/forgot-password/[token]' ||
    router.pathname === '/workspace/create'

  const [session, setSession] = useState<Session | null>(null)

  const authentication = useMemo(
    () => ({
      signIn: () => {
        setSession({
          user: {
            name: 'Usuario Demo',
            email: 'demo@fonoster.com',
            image: 'https://avatars.githubusercontent.com/u/default'
          }
        })
        router.push('/')
      },
      signOut: () => {
        setSession(null)
        router.push('/signin')
      }
    }),
    [router]
  )

  if (isAuthPage) {
    return (
      <LayoutProvider session={session} authentication={authentication}>
        <Component />
      </LayoutProvider>
    )
  }

  return (
    <MainLayout session={session} authentication={authentication}>
      <Component />
    </MainLayout>
  )
}
