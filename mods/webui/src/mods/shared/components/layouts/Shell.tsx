import { useLayoutEffect, useMemo, useState } from 'react'

import { ScreenDetails } from '@/@types/ScreenDetails'
import * as screensDetails from '@/data/screensDetails'
import { InsideDocs } from '@/mods/shared/components/InsideDocs'
import { classes } from '@/mods/shared/helpers/classes'
import { useTitle } from '@/mods/shared/hooks/useTitle'
import { Button, Text, Title } from '@/ui'

interface Props {
  name: string
}

export const Shell: React.FC<Props> = ({ name, children }) => {
  const [isInsideDocsOpen, setInsideDocsOpen] = useState(false)
  const { setTitle, removeGaps, setFullScreen } = useTitle()

  const data: ScreenDetails = useMemo(
    () => ({
      ...screensDetails[name],
    }),
    [name]
  )

  useLayoutEffect(() => {
    setTitle(data.title)
    removeGaps()

    if (data?.docs?.title) {
      setFullScreen()
    }
  }, [setTitle, removeGaps, data, setFullScreen])

  return (
    <>
      <div className="flex-1 flex items-stretch overflow-hidden">
        <main className="flex-1 overflow-y-auto py-6 pl-6">
          <section className="min-w-0 pr-6 flex-1 h-full flex flex-col lg:order-last">
            <div className="w-full flex items-center justify-between mb-4">
              <div className="lg:w-4/6">
                <Title level={3}>{data.subtitle}</Title>
                <Text className="whitespace-normal">
                  {data.description}
                  {data?.docs?.url && (
                    <a
                      className="term"
                      href={data.docs.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Learn more.
                    </a>
                  )}
                </Text>
              </div>
              {data?.docs && (
                <div className="hidden lg:block">
                  <Button
                    type="text"
                    className={classes(
                      '!ring-offset-2 !ring-1 ring-opacity-5',
                      isInsideDocsOpen
                        ? '!ring-offset-primary !ring-primary'
                        : '!ring-offset-gray-600 !ring-gray-600'
                    )}
                    onClick={() => setInsideDocsOpen(!isInsideDocsOpen)}
                  >
                    SDK
                  </Button>
                </div>
              )}
            </div>
            <div>{children}</div>
          </section>
        </main>

        {data?.docs && (
          <InsideDocs
            show={isInsideDocsOpen}
            title={data.docs.title}
            content={data.docs.example}
            tableContent={data?.docs?.tableContent}
            description={data.docs.description}
          />
        )}
      </div>
    </>
  )
}
