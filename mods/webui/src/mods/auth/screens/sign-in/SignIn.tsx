import { BadgeCheckIcon } from '@heroicons/react/outline'
import type { GetServerSideProps, NextPage } from 'next'
import { signIn } from 'next-auth/react'
import { getSession } from 'next-auth/react'
import { useCallback, useState } from 'react'

import { Button, Container, Text, Title, WhiteText } from '@/ui'
import { SignInIcon } from '@/ui'

import { useRedirect } from '../../hooks/useRedirect'
import { PoliciesOfUse } from './PoliciesOfUse'

export const features = [
  'Programmable Voice',
  'Phone Verification',
  'Call Tracking',
  'Click-to-Call',
  'Phone System IVR',
  'Voice Alerts',
]

export const SignIn: NextPage = () => {
  const [isLoading, setLoading] = useState(false)

  useRedirect()

  const signInGithub = useCallback(() => {
    setLoading(true)

    signIn('github')
  }, [])

  return (
    <div className="flex-1 relative flex overflow-hidden">
      <main className="flex-1 relative overflow-y-auto focus:outline-none xl:order-last">
        <div className="absolute inset-0 py-6 px-4 sm:px-6 lg:px-8">
          <Container>
            <div className="max-w-lg mx-auto">
              <SignInIcon />

              <Title className="my-7">Sign in</Title>
              <Text className="mb-7">
                Fonoster is a cloud-based service that provides developers with
                tools for building, deploying, and scaling customer engagement
                solutions.
              </Text>

              <Button
                loading={isLoading}
                onClick={signInGithub}
                data-intent="Sign In to Fonoster with Github account"
              >
                Sign In with Github
              </Button>

              <PoliciesOfUse />
            </div>
          </Container>
        </div>
      </main>
      <aside className="hidden relative xl:order-first xl:flex xl:flex-col flex-shrink-0 w-96 overflow-y-auto bg-gray-500">
        <div className="absolute inset-0 py-12 px-4 sm:px-6 lg:px-8">
          <div className="h-full">
            <Title level={3} className="mb-8">
              What{"'"}s <strong className="text-primary">inside</strong>:
            </Title>
            {features.map(feature => (
              <div key={feature} className="flex items-center text-center my-4">
                <BadgeCheckIcon
                  className="mr-4 h-6 w-6 text-primary"
                  aria-hidden="true"
                />
                <WhiteText className="m-0 p-0">{feature}</WhiteText>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req })

  return {
    props: {
      session,
    },
  }
}

export default SignIn
