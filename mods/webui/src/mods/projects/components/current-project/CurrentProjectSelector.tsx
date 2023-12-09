/* eslint-disable sonarjs/cognitive-complexity */
import type { Project } from '@fonoster/projects/dist/client/types'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, SelectorIcon } from '@heroicons/react/solid'
import { Fragment } from 'react'

import { classes } from '@/mods/shared/helpers/classes'
import {
  generateRandomColor,
  ProjectProfile,
} from '@/mods/users/screens/home/Home'
import { WhiteText } from '@/ui'

import { useCurrentProject } from './useCurrentProject'

export const CurrentProjectSelector = () => {
  const { projects, currentProject, changeCurrentProject } = useCurrentProject()

  return (
    <>
      <Listbox
        value={currentProject}
        onChange={data => changeCurrentProject(data)}
      >
        {({ open }) => (
          <>
            <div className="w-full relative mt-6">
              <Listbox.Button
                data-desc={`Project ID: ${currentProject?.ref}`}
                data-intent="Change current project"
                className="flex items-center relative w-full pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none sm:text-sm"
              >
                {currentProject?.name && (
                  <ProjectProfile
                    project={currentProject as Project}
                    color={generateRandomColor(currentProject.ref)}
                    size="10"
                  />
                )}
                <div>
                  <WhiteText className="m-0 p-0 font-medium">
                    {currentProject?.name}
                  </WhiteText>
                  <span className="font-sm text-gray-200">Current project</span>
                </div>

                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <SelectorIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>

              <Transition
                show={open}
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 ml-2 w-[92%] bg-gray-600 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  {projects.map(item => (
                    <Listbox.Option
                      key={item.ref}
                      className={({ active }) =>
                        classes(
                          active ? 'text-white bg-primary' : 'text-white',
                          'cursor-default select-none relative py-2 pl-3 pr-9'
                        )
                      }
                      value={item}
                      data-desc={`Project ID: ${item.ref}`}
                      data-intent="Change current project"
                    >
                      {({ selected, active }) => (
                        <>
                          <span
                            className={classes(
                              selected || item.ref === currentProject?.ref
                                ? 'font-semibold'
                                : 'font-normal',
                              'block truncate'
                            )}
                            data-desc={`Project ID: ${item.ref}`}
                            data-intent="Change current project"
                          >
                            {item.name}
                          </span>

                          {selected || item.ref === currentProject?.ref ? (
                            <span
                              className={classes(
                                active ? 'text-white' : 'text-primary',
                                'absolute inset-y-0 right-0 flex items-center pr-4'
                              )}
                              data-desc={`Project ID: ${item.ref}`}
                              data-intent="Change current project"
                            >
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
    </>
  )
}
