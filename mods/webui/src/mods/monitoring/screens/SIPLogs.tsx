import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useLayoutEffect, useState } from 'react'
import { dehydrate } from 'react-query'

import type { AppPage } from '@/@types'
import { TIMES } from '@/mods/shared/constants/filters'
import { useTitle } from '@/mods/shared/hooks/useTitle'
import { getQueryClient } from '@/mods/shared/libs/queryClient'
import { Badge, Spinner, Text, Title } from '@/ui'
import { Json } from '@/ui/JsonViewer'

import { LogsHeader } from '../components/LogsHeader'
import { NoLogs } from '../components/NoLogs'
import { useLogs } from '../hooks/useLogs'
import { getLevel } from '../lib/logsUtilities'

export const SIPLogsBoard: AppPage = () => {
  const [timestamp, setTimestamp] = useState(TIMES[0])
  const { events, isSuccess } = useLogs({
    time: timestamp.value,
    eventType: 'sip',
  })
  const { setTitle } = useTitle()

  useLayoutEffect(() => {
    setTitle('Monitoring')
  }, [setTitle])

  return (
    <>
      <div className="mb-4 lg:w-4/6">
        <Title level={3}>SIP Network logs</Title>
        <Text className="whitespace-normal">
          Here you will find notifications related to events and errors on your
          SIP Network.{' '}
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
                  <table className="table-auto border-collapse rounded">
                    <thead className="bg-gray-600">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-6 text-left text-xs font-medium text-white tracking-wider"
                        >
                          SEVERITY
                        </th>
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
                          TIME
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-6 text-left text-xs font-medium text-white tracking-wider"
                        >
                          MESSAGE
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-6 text-left text-xs font-medium text-white tracking-wider"
                        >
                          DATA
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event, idx) => (
                        <tr
                          key={event.ref}
                          className={
                            idx % 2 === 0 ? 'bg-gray-600' : 'bg-gray-500'
                          }
                        >
                          <td className="px-6 py-4 text-gray-200 capitalize truncate">
                            <Badge
                              dot
                              color={getLevel(event.level).color as any}
                            >
                              {getLevel(event.level).message}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 font-medium text-white">
                            {event.ref}
                          </td>
                          <td className="px-6 py-4 text-gray-200 truncate">
                            {new Date(event.timestamp).toUTCString()}
                          </td>
                          <td className="px-6 py-4 whitespace-normal text-gray-200 truncate max-w-[360px] min-w-[320px]">
                            {event.message}
                          </td>
                          <td className="px-6 py-4 whitespace-normal text-gray-200 truncate max-w-[560px] min-w-[400px]">
                            <Json
                              data={event.body}
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

SIPLogsBoard.isProtected = true

export default SIPLogsBoard
