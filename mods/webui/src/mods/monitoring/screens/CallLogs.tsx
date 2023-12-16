import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import React, { useCallback, useLayoutEffect, useState } from 'react'
import { dehydrate } from 'react-query'

import type { AppPage } from '@/@types'
import { TIMES } from '@/mods/shared/constants/filters'
import { useTitle } from '@/mods/shared/hooks/useTitle'
import { getQueryClient } from '@/mods/shared/libs/queryClient'
import { Spinner, Text, Title } from '@/ui'
import { Json } from '@/ui/JsonViewer'

import { LogsHeader } from '../components/LogsHeader'
import { NoLogs } from '../components/NoLogs'
import { useLogs } from '../hooks/useLogs'

export const TerminationCause = {
  UNKNOWN: 'Oops, something went wrong. Please trying again later',
  CAUSE_NORMAL_CLEARING: 'Call ended normally',
  CAUSE_UNALLOCATED: 'Unallocated (unassigned) number, no route to destination',
  CAUSE_USER_BUSY: 'The user is busy',
  CAUSE_NO_USER_RESPONSE: 'No answer from the user',
  CAUSE_CALL_REJECTED: 'The user has rejected the call',
  CAUSE_INVALID_NUMBER_FORMAT: 'Invalid number format',
  CAUSE_NORMAL_CIRCUIT_CONGESTION: 'Normal circuit congestion',
}

export const CallLogsBoard: AppPage = () => {
  const [timestamp, setTimestamp] = useState(TIMES[0])
  const { events, isSuccess } = useLogs({
    time: timestamp.value,
    eventType: 'call',
  })
  const { setTitle } = useTitle()

  useLayoutEffect(() => {
    setTitle('Monitoring')
  }, [setTitle])

  const renderBody = useCallback((body: Record<string, any>) => {
    delete body['from']
    delete body['to']
    delete body['duration']
    delete body['callId']

    return {
      ...body,
      terminationCause:
        TerminationCause[(body.terminationCause as string) || 'UNKNOWN'],
    }
  }, [])

  return (
    <>
      <div className="mb-4 lg:w-4/6">
        <Title level={3}>Call logs</Title>
        <Text className="whitespace-normal">
          Here you will find your call records.{' '}
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
      <LogsHeader onChange={data => setTimestamp(data)} total={events.length} />
      {isSuccess ? (
        <>
          {!events.length ? (
            <NoLogs />
          ) : (
            <div className="flex-1 flex items-stretch overflow-hidden">
              <main className="flex-1 overflow-y-auto">
                <section className="min-w-0 pr-6 flex-1 h-full flex flex-col lg:order-last">
                  <table className="w-full table-auto border-collapse rounded">
                    <thead className="bg-gray-600">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-6 text-left text-xs font-medium text-white tracking-wider"
                        >
                          CALL ID
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-6 text-left text-xs font-medium text-white tracking-wider"
                        >
                          DURATION
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-6 text-left text-xs font-medium text-white tracking-wider"
                        >
                          FROM
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-6 text-left text-xs font-medium text-white tracking-wider"
                        >
                          TO
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-6 text-left text-xs font-medium text-white tracking-wider"
                        >
                          MORE DATA
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event, idx) => (
                        <tr
                          key={event.body.callId as string}
                          className={
                            idx % 2 === 0 ? 'bg-gray-600' : 'bg-gray-500'
                          }
                        >
                          <td className="px-6 py-4 font-medium text-white">
                            {(event.body.callId as string) || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 text-gray-200 truncate">
                            {(event.body.duration as number) || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-normal text-gray-200 max-w-[360px] min-w-[280px]">
                            {`${(event.body.from as string) ?? 'Unknown'}`}
                          </td>
                          <td className="px-6 py-4 whitespace-normal text-gray-200 max-w-[360px] min-w-[280px]">
                            {`${(event.body.to as string) ?? 'Unknown'}`}
                          </td>
                          <td className="px-6 py-4 whitespace-normal text-gray-200 max-w-[560px] min-w-[400px]">
                            <Json
                              data={renderBody(event.body)}
                              bg={idx % 2 === 0 ? '#393d48' : '#2b2e35'}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              </main>
            </div>
          )}
        </>
      ) : (
        <Spinner />
      )}
    </>
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

CallLogsBoard.isProtected = true

export default CallLogsBoard
