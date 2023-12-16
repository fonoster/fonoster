import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useCallback, useLayoutEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { dehydrate } from 'react-query'

import { useLoggedIn } from '@/mods/auth/hooks/useLoggedIn'
import { useRefreshSecret } from '@/mods/auth/hooks/useRefreshSecret'
import { Confirm } from '@/mods/shared/components/Confirm'
import { Notifier } from '@/mods/shared/components/Notification'
import { useTitle } from '@/mods/shared/hooks/useTitle'
import { getQueryClient } from '@/mods/shared/libs/queryClient'
import { Button, Input, Text, Title } from '@/ui'

import { useEditUser } from '../../hooks/useEditUser'

export function Account() {
  const [isSecretConfirmOpen, setSecretConfirmOpen] = useState(false)
  const { setTitle } = useTitle()
  const { user } = useLoggedIn()

  const [secret, setSecret] = useState(user?.accessKeySecret || '')

  const { mutate, isLoading } = useRefreshSecret()
  const { mutate: edit, isLoading: isEditLoading } = useEditUser()

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
    },
  })

  useLayoutEffect(() => {
    setTitle(user?.name || 'Me')
  }, [setTitle, user])

  const onRefreshSecret = useCallback(() => {
    mutate(undefined, {
      onSuccess({ token }) {
        setSecretConfirmOpen(false)

        Notifier.success(
          'Your secret access key has been successfully renewed.'
        )

        setSecret(token)
      },
    })
  }, [mutate])

  const onSave = useCallback(
    user => {
      edit(user, {
        onSuccess() {
          Notifier.success('Your Account has been successfully edited.')
        },
      })
    },
    [edit]
  )

  const name = watch('name')

  return (
    <>
      <div className="flex-1 relative flex overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none xl:order-first">
          <div className="absolute inset-0">
            <div>
              <div>
                <Title level={4} className="leading-6 m-0">
                  Account details
                </Title>
                <Text>
                  Use your Account credentials with the Projects API or to login
                  into the Command-Line Tool.{' '}
                  <a
                    className="term"
                    href="https://learn.fonoster.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn more.
                  </a>
                </Text>
              </div>
              <div className="mt-5">
                <dl>
                  <div className="pb-4 mt-4 sm:grid sm:grid-cols-1 sm:gap-4">
                    <dd className="text-sm text-white sm:mt-0 sm:col-span-1">
                      <Controller
                        name="name"
                        control={control}
                        rules={{ required: true }}
                        render={({
                          field: { name, onBlur, onChange, value },
                        }) => (
                          <Input
                            className="mb-4"
                            label="Name"
                            placeholder="Type your name"
                            disabled={isLoading}
                            error={errors?.name && 'You must enter a name'}
                            {...{
                              name,
                              onBlur,
                              onChange,
                              value,
                            }}
                          />
                        )}
                      />
                    </dd>
                  </div>

                  <div className="flex-shrink-0 flex justify-end">
                    <Button
                      className="ml-4"
                      loading={isEditLoading}
                      disabled={!isDirty || name === user?.name}
                      type={isDirty ? 'primary' : 'secondary'}
                      onClick={handleSubmit(onSave)}
                    >
                      Save changes
                    </Button>
                  </div>

                  <div className="pt-4 sm:pt-5 sm:grid sm:grid-cols-1 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-200">
                      Access Key ID
                    </dt>
                    <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                      <Input readOnly copy value={user?.accessKeyId} />
                    </dd>
                  </div>
                  <div className="pt-4 sm:py-5 sm:grid sm:grid-cols-1 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-200">
                      Access Key Secret
                    </dt>
                    <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2 flex flex-col items-end">
                      <Input
                        reveal
                        readOnly
                        copy
                        value={secret}
                        className="w-full"
                      />
                      <Button
                        key="refresh-secret"
                        size="small"
                        type="secondary"
                        onClick={() => setSecretConfirmOpen(true)}
                        loading={isLoading}
                        className="mt-2 text"
                      >
                        {isLoading ? 'Loading...' : 'Re-generate Secret'}
                      </Button>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Confirm
        isOpen={isSecretConfirmOpen}
        isLoading={isLoading}
        onClick={onRefreshSecret}
        onClose={() => setSecretConfirmOpen(false)}
        textToConfirm={user.name || 'Confirm'}
      />
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req })
  const queryClient = getQueryClient()

  return {
    props: {
      session,
      dehydratedState: dehydrate(queryClient),
    },
  }
}

Account.isProtected = true

export default Account
