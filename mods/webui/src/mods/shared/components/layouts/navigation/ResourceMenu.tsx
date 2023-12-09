import { Menu, Transition } from '@headlessui/react'
import {
  CollectionIcon,
  FolderAddIcon,
  KeyIcon,
  PhoneIcon,
  PlusSmIcon,
} from '@heroicons/react/outline'
import React, { useMemo } from 'react'
import { Fragment } from 'react'

import { useCreationEditingAgent } from '@/mods/agents/components/creation-editing'
import { useCreationEditingApp } from '@/mods/apps/components/creation-editing'
import { useCreationEditingDomain } from '@/mods/domains/components/creation-editing'
import { useCreationEditingNumber } from '@/mods/numbers/components/creation-editing'
import { useCreationEditingProvider } from '@/mods/providers/components/creation-editing'
import { useCreationEditingSecret } from '@/mods/secrets/components/creation-editing'
import { classes } from '@/mods/shared/helpers/classes'
import { WhiteText } from '@/ui'

export const ResourceMenu = () => {
  const { open: openProviderPanel } = useCreationEditingProvider()
  const { open: openNumberPanel } = useCreationEditingNumber()
  const { open: openSecretPanel } = useCreationEditingSecret()
  const { open: openDomainPanel } = useCreationEditingDomain()
  const { open: openAgentPanel } = useCreationEditingAgent()
  const { open: openAppPanel } = useCreationEditingApp()

  const nav = useMemo(
    () => [
      {
        name: 'Applications',
        description: 'Connect with the PSTN',
        icon: () => <CollectionIcon className="h-6 w-6 text-primary" />,
        onClick: () => openAppPanel(),
      },
      {
        name: 'Trunks',
        description: 'Make and receive calls',
        icon: () => (
          <PhoneIcon className="h-6 w-6" style={{ color: '#e57530' }} />
        ),
        onClick: () => openProviderPanel(),
      },
      {
        name: 'Phone Numbers',
        description: 'Create a new Number',
        icon: () => (
          <PhoneIcon className="h-6 w-6" style={{ color: '#69A8FF' }} />
        ),
        onClick: () => openNumberPanel(),
      },
      {
        name: 'Secrets',
        description: 'Encrypted variables',
        icon: () => (
          <KeyIcon className="h-6 w-6" style={{ color: '#FDBF55' }} />
        ),
        onClick: () => openSecretPanel(),
      },
      {
        name: 'Domains',
        description: 'Group several SIP Agents',
        icon: () => (
          <FolderAddIcon className="h-6 w-6" style={{ color: '#9594F8' }} />
        ),
        onClick: () => openDomainPanel(),
      },
      {
        name: 'Agents',
        description: 'Create a new Agent',
        icon: () => (
          <PhoneIcon className="h-6 w-6" style={{ color: '#1ee2ce' }} />
        ),
        onClick: () => openAgentPanel(),
      },
    ],
    [
      openNumberPanel,
      openProviderPanel,
      openSecretPanel,
      openDomainPanel,
      openAgentPanel,
      openAppPanel,
    ]
  )

  return (
    <Menu as="div" className="z-10 absolute bottom-8 right-8 flex-shrink-0">
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="z-10 origin-bottom-right absolute overflow-y-auto max-h-[32rem] bottom-20 right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-gray-600 ring-1 ring-black ring-opacity-5 focus:outline-none">
          {nav.map(item => (
            <Menu.Item key={item.name}>
              {({ active }) => (
                <button
                  className={classes(
                    active ? 'bg-gray-600' : '',
                    'flex w-full block px-4 py-2 text-sm text-gray-200 text-left'
                  )}
                  onClick={item.onClick}
                >
                  <div
                    className={classes(
                      'p-4 border rounded border-gray-400 transition ease-in duration-75',
                      active ? 'border-white opacity-100' : 'opacity-80'
                    )}
                  >
                    <item.icon />
                  </div>
                  <div className="ml-4">
                    <WhiteText className="m-0 p-0">{item.name}</WhiteText>
                    <div className="text-xs text-gray-400">
                      {item.description}
                    </div>
                  </div>
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>

      <div>
        <Menu.Button className="flex bg-primary p-4 rounded-full items-center justify-center text-white focus:outline-none text-sm">
          <PlusSmIcon className="h-8 w-8" aria-hidden="true" />
        </Menu.Button>
      </div>
    </Menu>
  )
}
