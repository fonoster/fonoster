import type { Project } from '@fonoster/projects/dist/client/types'
import { Menu, Transition } from '@headlessui/react'
import { DotsHorizontalIcon, PlusIcon } from '@heroicons/react/outline'
import type { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { getSession } from 'next-auth/react'
import { Fragment, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { dehydrate } from 'react-query'

import type { AppPage } from '@/@types'
import { useLoggedIn } from '@/mods/auth/hooks/useLoggedIn'
import { useCreationEditingProject } from '@/mods/projects/components/creation-editing'
import { useCurrentProject } from '@/mods/projects/components/current-project'
import { useDeleteProject } from '@/mods/projects/hooks/useDeleteProject'
import { DeleteResource } from '@/mods/shared/components/DeleteResource'
import { Notifier } from '@/mods/shared/components/Notification'
import { classes } from '@/mods/shared/helpers/classes'
import { useTitle } from '@/mods/shared/hooks/useTitle'
import { getQueryClient } from '@/mods/shared/libs/queryClient'
import { Spinner, Text, Title, WhiteText } from '@/ui'

export const ProjectProfile = (props: {
  project: Project
  color: string
  size?: string
}) => {
  const background = useRef(props.color).current

  const getInitials = useCallback((name: string) => {
    const names = name.split(' ')

    const firstName = names[0]
    const lastName = names?.length > 1 ? names[1] : names[0]

    const firstLetter = firstName.charAt(0)
    const secondLetter = lastName.charAt(firstName !== lastName ? 0 : 1)

    return `${firstLetter}${secondLetter}`.toUpperCase()
  }, [])

  return (
    <div
      style={{
        background,
      }}
      className={`mr-6 flex-shrink-0 flex items-center justify-center h-${
        props.size || 12
      } w-${
        props.size || 12
      } rounded-md bg-gray-800 border border-transparent outline-none ring-2 ring-offset-4 ring-gray-400/[.35] ring-offset-gray-700`}
    >
      <div className="text-white text-lg font-bold opacity">
        <WhiteText className="m-0 p-0">
          {getInitials(props.project.name)}
        </WhiteText>
      </div>
    </div>
  )
}

const learnResources = [
  {
    title: 'Documentation',
    description:
      'Technical overviews, how-tos, release notes, and support material.',
    url: 'https://learn.fonoster.com/docs',
  },
  {
    title: 'Dialogflow connector',
    description: 'Connect your existing DialogFlow Agents with the PSTN.',
    url: 'https://learn.fonoster.com/docs/tutorials/connecting_with_dialogflow',
  },
  {
    title: 'How can we help?',
    description:
      'Business & Community Support, articles, and product documentation.',
    url: 'https://learn.fonoster.com/docs/community',
  },
]

export const generateRandomColor = (id: string) => {
  const letters = '0123456789ABCDEF'
  let color = '#'

  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }

  color = localStorage.getItem(id) || color

  localStorage.setItem(id, color)

  return color
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export const Home: AppPage = () => {
  const { user } = useLoggedIn()
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false)
  const { mutate, isLoading } = useDeleteProject()
  const [deleteRef, setDeleteRef] = useState('')
  const { setTitle, setLayout } = useTitle()
  const { openEditing, open } = useCreationEditingProject()

  const { projects, isSuccess, changeCurrentProject } = useCurrentProject()

  useLayoutEffect(() => {
    setTitle('Home')
    setLayout('home')
  }, [setTitle, setLayout])

  const onOpen = useCallback((refId: string) => {
    setDeleteModalOpen(true)
    setDeleteRef(refId)
  }, [])

  const onDelete = useCallback(() => {
    mutate(deleteRef, {
      onSuccess() {
        setDeleteModalOpen(false)

        Notifier.success('Your Project has been successfully deleted.')
      },
    })
  }, [mutate, deleteRef])

  const { push } = useRouter()

  const goToProject = useCallback(
    (project: Project) => {
      changeCurrentProject(project)

      setTimeout(() => push('/project-overview'), 100)
    },
    [changeCurrentProject, push]
  )

  return isSuccess ? (
    <>
      <div className="flex-1 relative flex overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none xl:order-first">
          <div className="absolute inset-0 py-6 px-4 sm:px-6 lg:px-8">
            <Title level={2} className="mb-8">
              Hey <strong>{user.name?.split(' ')?.[0]}</strong>, welcome to{' '}
              <strong>Fonoster</strong>!
            </Title>
            <Title level={4}>
              Ready to engage your customers better, faster?
            </Title>
            <Text className="max-w-lg">
              Create a new project to begin managing your SIP Network and
              Programmable Voice Applications.{' '}
              <a
                href="https://learn.fonoster.com/docs/getting_started/create_a_voice_application"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-bold"
              >
                Learn more.
              </a>
            </Text>
            <div className="grid grid-cols-2 gap-4 mt-8">
              {projects.map(project => (
                <div
                  key={project.ref}
                  className="h-48 min-h-full relative rounded-lg bg-gray-600 p-6 shadow-sm flex space-x-4 justify-between flex-col"
                >
                  <div
                    className="flex cursor-pointer"
                    onClick={() => goToProject(project)}
                  >
                    <ProjectProfile
                      project={project}
                      color={generateRandomColor(project.ref)}
                    />
                    <div>
                      <Title level={4} className="m-0 p-0 truncate max-w-[90%]">
                        {project.name}
                      </Title>
                      <Text className="m-0 p-0 text-sm max-w-[90%]">
                        {project.ref}
                      </Text>
                    </div>
                  </div>
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
                                onClick={() => openEditing(project)}
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
                                onClick={() => onOpen(project.ref)}
                              >
                                Delete
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              ))}
              <div
                onClick={() => open()}
                className="cursor-pointer opacity-75 hover:opacity-100 transition duration-150 ease-in-out flex justify-center items-center space-x-4 border border-dashed border-primary rounded-lg h-48 min-h-full"
              >
                <PlusIcon
                  className="block h-12 w-12 text-primary"
                  aria-hidden="true"
                  strokeWidth={1}
                />
              </div>
            </div>
          </div>
        </main>
        <aside className="hidden relative xl:order-last xl:flex xl:flex-col flex-shrink-0 w-96 overflow-y-auto bg-gray-800">
          <div className="absolute inset-0 py-12 px-4 sm:px-6 lg:px-8">
            <div className="h-full">
              <Title level={3}>Learn more</Title>

              <div className="mt-8">
                {learnResources.map(resource => (
                  <a
                    key={resource.title}
                    className="block mb-8 hover:opacity-75 transition duration-150 ease-in-out"
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Title className="!text-primary" level={5}>
                      {resource.title}
                    </Title>
                    <Text className="p-0 m-0">{resource.description}</Text>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
      <DeleteResource
        refId={deleteRef}
        title={`Delete Project (${deleteRef})`}
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

Home.isProtected = true

export default Home
