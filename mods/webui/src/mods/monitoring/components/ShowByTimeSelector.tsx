import { Listbox, Transition } from '@headlessui/react'
import { CalendarIcon } from '@heroicons/react/outline'
import { CheckIcon, SelectorIcon } from '@heroicons/react/solid'
import { Fragment, useEffect, useMemo, useState } from 'react'

import { Time, TIMES } from '@/mods/shared/constants/filters'
import { classes } from '@/mods/shared/helpers/classes'

interface Props {
  onChange: (data: Time) => void
}

export const ShowByTimeSelector: React.FC<Props> = ({ onChange }) => {
  const [data, setData] = useState<Time | null>(null)

  useEffect(() => {
    data && onChange(data)
  }, [data, onChange])

  const label = useMemo(() => data?.label ?? 'Show by time', [data])

  return (
    <Listbox value={data} onChange={setData}>
      {({ open }) => (
        <>
          <div className="min-w-[200px] relative">
            <Listbox.Button className="filter">
              <span className="inline-flex justify-center items-center truncate text-gray-200">
                <div>
                  <CalendarIcon
                    className="mr-3 h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                {label}
              </span>
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
              <Listbox.Options className="absolute z-10 mt-1 w-full bg-gray-600 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {TIMES.map(time => (
                  <Listbox.Option
                    key={time.value}
                    className={({ active }) =>
                      classes(
                        active
                          ? 'text-white bg-gray-800 cursor-pointer'
                          : 'text-gray-200',
                        'cursor-default select-none relative py-2 pl-3 pr-9'
                      )
                    }
                    value={time}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={classes(
                            selected || time.value === data?.value
                              ? 'font-semibold text-white'
                              : 'font-normal',
                            'block truncate'
                          )}
                        >
                          {time.label}
                        </span>

                        {selected || time.value === data?.value ? (
                          <span
                            className={classes(
                              active ? 'text-white' : 'text-primary',
                              'absolute inset-y-0 right-0 flex items-center pr-4'
                            )}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
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
  )
}
