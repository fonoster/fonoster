import { CollectionIcon, KeyIcon } from '@heroicons/react/outline'
import { useLayoutEffect } from 'react'

import { ProjectSettingsPanel } from '@/mods/projects/components/settings'
import { useTitle } from '@/mods/shared/hooks/useTitle'
import { Text, Title } from '@/ui'

const resources = [
  {
    title: 'Programmable Voice',
    description:
      'Build voice apps over the global phone network. Make, receive...',
    onClick: () => 4,
    icon: () => (
      <CollectionIcon className="text-primary h-10 w-10" aria-hidden="true" />
    ),
  },
  {
    title: 'Manage Secrets',
    description:
      'Secrets are encrypted variables that you can you use in your...',
    onClick: () => 4,
    icon: () => (
      <KeyIcon
        className="h-10 w-10"
        aria-hidden="true"
        style={{
          color: '#FDBF55',
        }}
      />
    ),
  },
]

export function Page() {
  const { setTitle } = useTitle()

  useLayoutEffect(() => {
    setTitle('Project Overview')
  }, [setTitle])

  return (
    <div className="flex-1 relative flex overflow-hidden">
      <main className="flex-1 relative overflow-y-auto focus:outline-none xl:order-first">
        <div className="absolute inset-0 py-6 px-4 sm:px-6 lg:px-8">
          <ProjectSettingsPanel />
        </div>
      </main>
      <aside className="hidden relative xl:order-last xl:flex xl:flex-col flex-shrink-0 w-96 overflow-y-auto bg-gray-800">
        <div className="absolute inset-0 py-12 px-4 sm:px-6 lg:px-8">
          <div className="h-full">
            <Title level={3}>Create something new</Title>

            <div className="mt-8">
              {resources.map(resource => (
                <div
                  key={resource.title}
                  className="flex mb-8 hover:opacity-75 transition duration-150 ease-in-out"
                  onClick={resource.onClick}
                >
                  <div className="flex items-center px-4 border rounded-md border-gray-400 mr-4 h-16 w-16">
                    <resource.icon />
                  </div>
                  <div>
                    <Title level={5}>{resource.title}</Title>
                    <Text className="p-0 m-0">{resource.description}</Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

Page.isProtected = true

export default Page
