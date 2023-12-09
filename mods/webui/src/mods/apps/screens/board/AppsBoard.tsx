/* eslint-disable sonarjs/no-duplicate-string */
import { Menu, Transition } from '@headlessui/react'
import { DotsHorizontalIcon } from '@heroicons/react/outline'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { Fragment, useCallback, useState } from 'react'
import { dehydrate } from 'react-query'

import type { AppPage } from '@/@types'
import { DeleteResource } from '@/mods/shared/components/DeleteResource'
import { Shell } from '@/mods/shared/components/layouts/Shell'
import { Notifier } from '@/mods/shared/components/Notification'
import { classes } from '@/mods/shared/helpers/classes'
import { getQueryClient } from '@/mods/shared/libs/queryClient'
import { Spinner } from '@/ui'

import { useCreationEditingApp } from '../../components/creation-editing'
import { useApps } from '../../hooks/useApps'
import { useDeleteApp } from '../../hooks/useDeleteApp'
import { NoApps } from './NoApps'

export const AppsBoard: AppPage = () => {
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false)
  const { mutate, isLoading } = useDeleteApp()
  const [deleteRef, setDeleteRef] = useState('')
  const { apps, isSuccess } = useApps()

  const { openEditing } = useCreationEditingApp()

  const onOpen = useCallback((refId: string) => {
    setDeleteModalOpen(true)
    setDeleteRef(refId)
  }, [])

  const onDelete = useCallback(() => {
    mutate(deleteRef, {
      onSuccess() {
        setDeleteModalOpen(false)

        Notifier.success('Your App has been successfully deleted.')
      },
    })
  }, [mutate, deleteRef])

  if (isSuccess && !apps.length) return <NoApps />

  return isSuccess ? (
    <>
      <Shell name="apps">
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
                NAME
              </th>
              <th
                scope="col"
                className="px-6 py-6 text-left text-xs font-medium text-white tracking-wider"
              >
                PROJECT ID
              </th>
              <th
                scope="col"
                className="px-6 py-6 text-left text-xs font-medium text-white tracking-wider"
              >
                WELCOME INTENT ID
              </th>
              <th
                scope="col"
                className="px-6 py-6 text-left text-xs font-medium text-white tracking-wider"
              >
                VOICE
              </th>
              <th scope="col" className="relative px-6 py-6">
                <span className="sr-only">ACTIONS</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app, idx) => (
              <tr
                key={app.ref}
                className={idx % 2 === 0 ? 'bg-gray-600' : 'bg-gray-500'}
              >
                <td className="px-6 py-4 font-medium text-white">{app.ref}</td>
                <td className="px-6 py-4 text-gray-200">{app.name}</td>
                <td className="px-6 py-4 text-gray-200">
                  {app?.intentsEngineConfig?.projectId || 'N/A'}
                </td>
                <td className="px-6 py-4 text-gray-200">
                  {app?.intentsEngineConfig?.welcomeIntentId || 'N/A'}
                </td>
                <td className="px-6 py-4 text-gray-200">
                  {app?.speechConfig?.voice || 'N/A'}
                </td>
                <td className="px-6 py-4 text-right font-medium">
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
                                data-desc={`Application ID: ${app.ref}`}
                                data-intent="Edit application"
                                onClick={() => openEditing(app as any)}
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
                                onClick={() => onOpen(app.ref)}
                                data-desc={`Application ID: ${app.ref}`}
                                data-intent="Delete application"
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
        title={`Delete App (${deleteRef})`}
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

AppsBoard.isProtected = true

export default AppsBoard
