/* eslint-disable @next/next/no-img-element */
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { BellIcon, MenuIcon, XIcon } from '@heroicons/react/outline'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import React from 'react'
import { Fragment } from 'react'

import { useLoggedIn, userStore } from '@/mods/auth/hooks/useLoggedIn'
import { currentProjectStorage } from '@/mods/projects/components/current-project'
import { useTitle } from '@/mods/shared/hooks/useTitle'
import { Title } from '@/ui'

import { config } from '../../constants/config'
import { classes } from '../../helpers/classes'
import { Banner } from './Banner'
import { Notifications } from './Notifications'

const userNavigation: {
  name: string
  href: string
  onClick?: () => void
}[] = [{ name: 'Your Account', href: '/account' }]

if (config.WEBUI_BILLING_URL) {
  userNavigation.push({
    name: 'Billing',
    href: config.WEBUI_BILLING_URL,
  })
}

userNavigation.push({
  name: 'Sign out',
  href: '#',
  onClick: () => {
    userStore.destroy()
    currentProjectStorage.destroy()
    signOut()
  },
})

export const Header = () => {
  const { title, layout } = useTitle()
  const { user } = useLoggedIn()

  return (
    <>
      <Disclosure as="nav" className="bg-gray-600">
        {({ open }) => (
          <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  {layout === 'default' ? (
                    <div className="flex-1 flex justify-center items-center">
                      <Title
                        level={4}
                        className="w-full flex m-0 p-0 block truncate"
                      >
                        {title}
                      </Title>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 flex items-center">
                      <img
                        className="block h-8 w-auto"
                        src="/isotipo.svg"
                        alt="Fonoster"
                      />
                    </div>
                  )}
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center">
                  <Notifications />

                  {/* Profile dropdown */}
                  <Menu as="div" className="ml-3 relative">
                    <div>
                      <Menu.Button className="max-w-xs flex items-center text-sm rounded-full focus:outline-none">
                        <div className="flex items-center px-4">
                          <div className="flex-shrink-0">
                            <span className="sr-only">Open user menu</span>
                            {user?.avatar && (
                              <img
                                className="h-8 w-8 rounded-full"
                                src={user?.avatar}
                                alt=""
                              />
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-base font-medium text-white">
                              {user?.name}
                            </div>
                          </div>
                        </div>
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="z-10 origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-600 ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {userNavigation.map(item => (
                          <Menu.Item key={item.name}>
                            {({ active }) => (
                              <Link href={item.href}>
                                <a
                                  className={classes(
                                    active ? 'bg-gray-500' : '',
                                    'block px-4 py-2 text-sm text-gray-200'
                                  )}
                                  onClick={item.onClick}
                                >
                                  {item.name}
                                </a>
                              </Link>
                            )}
                          </Menu.Item>
                        ))}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
                <div className="-mr-2 flex items-center sm:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="bg-gray-600 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-500 focus:outline-none">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    {user?.avatar && (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user?.avatar}
                        alt=""
                      />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">
                      {user?.name}
                    </div>
                    <div className="text-sm font-medium text-gray-200">
                      {user?.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ml-auto bg-gray-600 flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-200 focus:outline-none"
                  >
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-3 space-y-1">
                  {userNavigation.map(item => (
                    <Disclosure.Button
                      key={item.name}
                      as="a"
                      href={item.href}
                      onClick={item.onClick}
                      className="block px-4 py-2 text-base font-medium text-gray-200 hover:text-gray-200 hover:bg-gray-600"
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
      {layout === 'home' && config.WEBUI_BANNER_ANNOUNCEMENT && (
        <Banner message={config.WEBUI_BANNER_ANNOUNCEMENT} />
      )}
    </>
  )
}
