import type { Event } from '@fonoster/monitor/dist/client/types'
import type { SearchEventsResponse } from '@fonoster/monitor/dist/client/types'
import { Menu, Transition } from '@headlessui/react'
import { BellIcon } from '@heroicons/react/outline'
import Link from 'next/link'
import React, { Fragment, useEffect, useState } from 'react'

import { useLogs } from '@/mods/monitoring/hooks/useLogs'
import { Text, Title, WhiteText } from '@/ui'

import { TIMES } from '../../constants/filters'
import { classes } from '../../helpers/classes'
import { Storage } from '../../helpers/Storage'

const DEFAULT_POLLING = 10_000 // Refresh every 10 seconds

const lastViewed = new Storage('lastViewed')

const Read: React.FC<{
  isOpen: boolean
  hasNotifications: boolean
  setHasNotifications: (hasNotifications: boolean) => void
  firstNotificationRef?: string
}> = ({
  hasNotifications,
  setHasNotifications,
  isOpen,
  firstNotificationRef,
}) => {
  const onViewed = React.useCallback(() => {
    setHasNotifications(false)

    if (firstNotificationRef) lastViewed.set(firstNotificationRef)
  }, [firstNotificationRef, setHasNotifications])

  useEffect(() => {
    if (isOpen) {
      onViewed()
    }
  }, [isOpen, onViewed])

  return (
    <>
      {hasNotifications && (
        <span className="flex absolute h-3 w-3 top-1 right-0 -mt-1 -mr-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
        </span>
      )}
    </>
  )
}

export const Notifications = () => {
  const [polling, setPolling] = useState(DEFAULT_POLLING)
  const [notifications, setNotifications] = React.useState<Event[]>([])
  const [hasNotifications, setHasNotifications] = React.useState(false)
  const [firstNotification, setFirstNotification] =
    React.useState<Event | null>(null)

  const onNotification = React.useCallback(
    (data: SearchEventsResponse) => {
      setPolling(DEFAULT_POLLING)

      setNotifications(previous => {
        if (!data.events.length) return previous

        const firstEvent = data.events[0]

        if (
          firstNotification?.ref !== firstEvent?.ref &&
          lastViewed.get() !== firstEvent?.ref
        ) {
          const state = data.events.filter(
            event =>
              !previous.some(previousEvent => previousEvent.ref === event.ref)
          )

          setHasNotifications(true)
          setFirstNotification(firstEvent)

          return state
        }

        return previous
      })
    },
    [setHasNotifications, setFirstNotification, firstNotification]
  )

  useLogs(
    {
      time: TIMES[0].value,
      level: 'error',
    },
    onNotification,
    polling,
    () => setPolling(polling * 60)
  )

  return (
    <>
      <Menu as="div" className="z-10 relative flex-shrink-0">
        {({ open }) => (
          <>
            <div className="relative inline-flex">
              <Menu.Button className="bg-gray-600 p-1 rounded-full text-gray-200 hover:text-gray-100 focus:outline-none">
                <BellIcon className="h-6 w-6" aria-hidden="true" />
              </Menu.Button>
              <Read
                isOpen={open}
                {...{
                  setHasNotifications,
                  hasNotifications,
                  firstNotificationRef: firstNotification?.ref,
                }}
              />
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
              <Menu.Items className="z-10 origin-top-right absolute overflow-y-auto max-h-[32rem] min-h-[240px] mt-2 w-80 rounded-md shadow-lg py-2 bg-gray-600 focus:outline-none right-0">
                {notifications.map(event => (
                  <Menu.Item key={event.ref}>
                    {() => (
                      <Link href={`/monitor/${event.eventType}`}>
                        <a
                          className={classes(
                            'flex w-full p-4 text-gray-200 text-left hover:bg-gray-600'
                          )}
                        >
                          <div
                            className={classes(
                              'transition ease-in duration-75'
                            )}
                          >
                            <BellIcon className="h-6 w-6 text-cancel" />
                          </div>
                          <div className="ml-4 whitespace-normal truncate">
                            <Text className="m-0 p-0">
                              <small>{event.message}</small>
                            </Text>
                            <WhiteText className="mt-3">
                              <small>
                                {new Date(event.timestamp).toUTCString()}
                              </small>
                            </WhiteText>
                          </div>
                        </a>
                      </Link>
                    )}
                  </Menu.Item>
                ))}

                {!notifications.length && (
                  <>
                    <div className="min-h-[240px] justify-center items-center flex">
                      <Title level={4} className="m-0 p-0">
                        You are all caught up.
                      </Title>
                    </div>
                  </>
                )}
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>
    </>
  )
}
