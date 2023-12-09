import { Dialog, Transition } from '@headlessui/react'
import { ExclamationIcon } from '@heroicons/react/outline'
import { Fragment } from 'react'

import { Button, Text, Title } from '@/ui'

interface DeleteResourceProps {
  title?: string
  description?: string
  isLoading?: boolean
  isOpen: boolean
  refId: string
  onDelete: () => void
  onClose: () => void
}

export const DeleteResource: React.FC<DeleteResourceProps> = ({
  isOpen,
  onDelete,
  onClose,
  isLoading,
  title = 'Delete Resource',
  description = 'Are you sure you want to delete this resource? It will be permanently removed from our servers. This action cannot be undone.',
}) => (
  <Transition.Root show={isOpen} as={Fragment}>
    <Dialog
      as="div"
      className="fixed z-10 inset-0 overflow-y-auto"
      onClose={onClose}
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enterTo="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 translate-y-0 sm:scale-100"
          leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div className="inline-block align-bottom bg-gray-600 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationIcon
                  className="h-6 w-6 text-red-600"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <Title level={3}>{title}</Title>
                <div className="mt-2">
                  <Text>{description}</Text>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <Button
                onClick={onDelete}
                loading={isLoading}
                className="ml-4"
                data-intent={title}
              >
                Delete
              </Button>
              <Button
                type="secondary"
                onClick={onClose}
                disabled={isLoading}
                data-intent={title}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Transition.Child>
      </div>
    </Dialog>
  </Transition.Root>
)
