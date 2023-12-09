/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable sonarjs/no-duplicate-string */
import { Menu, Transition } from '@headlessui/react'
import {
  DotsHorizontalIcon,
  PhoneIcon,
  StatusOfflineIcon,
} from '@heroicons/react/outline'
import type { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { dehydrate } from 'react-query'

import type { AppPage } from '@/@types'
import { DeleteResource } from '@/mods/shared/components/DeleteResource'
import { Shell } from '@/mods/shared/components/layouts/Shell'
import { Notifier } from '@/mods/shared/components/Notification'
import { __WEBUI_TEST_PHONE_CONFIG__ } from '@/mods/shared/constants/config'
import { classes } from '@/mods/shared/helpers/classes'
import { CallSessionState } from '@/mods/shared/libs/CallSessionState'
import { getQueryClient } from '@/mods/shared/libs/queryClient'
import { Button, Spinner } from '@/ui'

import { useCreationEditingNumber } from '../../components/creation-editing'
import { useDeleteNumber } from '../../hooks/useDeleteNumber'
import { useNumbers } from '../../hooks/useNumbers'
import { NoNumbers } from './NoNumbers'

export const NumbersBoard: AppPage = () => {
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false)
  const { mutate, isLoading } = useDeleteNumber()
  const [deleteRef, setDeleteRef] = useState('')
  const { numbers, isSuccess } = useNumbers()

  const { openEditing } = useCreationEditingNumber()

  const [wphone, setPhoneInstance] = useState<any>(null)
  const [callNumber, setCallNumber] = useState<string>('')

  const onTestCall = useCallback(async (e164Number: string) => {
    Notifier.info('Test Call in progress...', { closeButton: false })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const WPhone = require('wphone').default

    const phone = new WPhone(__WEBUI_TEST_PHONE_CONFIG__)

    if (!phone) return

    setPhoneInstance(phone)
    setCallNumber(e164Number)

    await phone.connect()
    await phone.call({
      targetAOR: 'sip:voice@default',
      extraHeaders: [`X-DID-Info: ${e164Number}`],
    })

    phone.inviter.stateChange.addListener((state: CallSessionState) => {
      if (state === CallSessionState.TERMINATED) {
        phone?.disconnect()

        setPhoneInstance(null)
        setCallNumber('')
      }
    })
  }, [])

  const onHangup = useCallback(() => {
    if (wphone?.isConnected()) {
      const isEstablishing = [
        CallSessionState.INITIAL,
        CallSessionState.ESTABLISHING,
      ].includes(wphone.inviter.state)

      if (isEstablishing)
        return Notifier.warning('Call not established, cannot hangup')

      wphone.inviter.state === CallSessionState.TERMINATED
        ? wphone.inviter.cancel()
        : wphone?.hangup()

      wphone?.disconnect()

      setPhoneInstance(null)
      setCallNumber('')
    }
  }, [wphone])

  const onOpen = useCallback((refId: string) => {
    setDeleteModalOpen(true)
    setDeleteRef(refId)
  }, [])

  const onDelete = useCallback(() => {
    mutate(deleteRef, {
      onSuccess() {
        setDeleteModalOpen(false)

        Notifier.success('Your Number has been successfully deleted.')
      },
    })
  }, [mutate, deleteRef])

  useEffect(() => {
    return () => {
      onHangup()
    }
  })

  if (isSuccess && !numbers.length) return <NoNumbers />

  return isSuccess ? (
    <>
      <Shell name="numbers">
        <table className="w-full table-auto border-collapse rounded">
          <thead className="bg-gray-600">
            <tr>
              <th
                scope="col"
                className="px-6 py-6 text-left text-xs font-medium text-white tracking-wider"
              >
                REF
              </th>
              <th
                scope="col"
                className="px-6 py-6 text-left text-xs font-medium text-white tracking-wider"
              >
                TRUNK REF
              </th>
              <th
                scope="col"
                className="px-6 py-6 text-left text-xs font-medium text-white tracking-wider"
              >
                E164 NUMBER
              </th>
              <th
                scope="col"
                className="px-6 py-6 text-left text-xs font-medium text-white tracking-wider"
              >
                WEBHOOK
              </th>
              <th scope="col" className="relative px-6 py-6">
                <span className="sr-only">ACTIONS</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {numbers.map((num, idx) => (
              <tr
                key={num.ref}
                className={idx % 2 === 0 ? 'bg-gray-600' : 'bg-gray-500'}
              >
                <td className="px-6 py-4 font-medium text-white">{num.ref}</td>
                <td className="px-6 py-4 text-gray-200">{num.providerRef}</td>
                <td className="px-6 py-4 text-gray-200">{num.e164Number}</td>
                <td className="px-6 py-4 text-gray-200">
                  {num.ingressInfo?.webhook}
                </td>
                <td className="flex items-center px-6 py-4 whitespace-nowrap text-right font-medium justify-end">
                  <Button
                    size="small"
                    className="mr-4"
                    icon={
                      callNumber === num.e164Number ? (
                        <StatusOfflineIcon
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      ) : (
                        <PhoneIcon className="h-4 w-4" aria-hidden="true" />
                      )
                    }
                    onClick={() =>
                      callNumber ? onHangup() : onTestCall(num.e164Number)
                    }
                    type={callNumber === num.e164Number ? 'link' : 'outline'}
                    data-desc={`Number ID: ${num.ref}`}
                    data-intent={`Test call to ${num.e164Number}`}
                  >
                    {callNumber === num.e164Number
                      ? 'Hangup call'
                      : 'Test Call'}
                  </Button>
                  <div className="flex justify-end">
                    <Menu as="div" className="relative flex-shrink-0">
                      <div>
                        <Menu.Button className="w-10 h-10 flex bg-gray-600 p-1 rounded-full items-center justify-center text-white focus:outline-none text-sm">
                          <DotsHorizontalIcon
                            className="h-6 w-6"
                            aria-hidden="true"
                          />
                        </Menu.Button>
                      </div>

                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="z-10 origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-600 ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={classes(
                                  active ? 'bg-gray-600' : '',
                                  'w-full block px-4 py-2 text-sm text-gray-200 text-left'
                                )}
                                onClick={() => openEditing(num)}
                                data-desc={`Number ID: ${num.ref}`}
                                data-intent="Edit Number"
                              >
                                Edit
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={classes(
                                  active ? 'bg-gray-600' : '',
                                  'w-full block px-4 py-2 text-sm text-gray-200 text-left'
                                )}
                                onClick={() => onOpen(num.ref)}
                                data-desc={`Number ID: ${num.ref}`}
                                data-intent="Delete Number"
                              >
                                Delete
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Shell>

      <DeleteResource
        refId={deleteRef}
        title={`Delete Number (${deleteRef})`}
        isOpen={isDeleteModalOpen}
        isLoading={isLoading}
        onDelete={onDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </>
  ) : (
    <Spinner />
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req })
  const queryClient = getQueryClient()

  /**
   * @todo Find a way to hydrate queries on server without using fetch or axios
   * await queryClient.prefetchQuery('projects', getProjects)
   */

  return {
    props: {
      session,
      dehydratedState: dehydrate(queryClient),
    },
  }
}

NumbersBoard.isProtected = true

export default NumbersBoard
