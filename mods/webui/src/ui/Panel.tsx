/* eslint-disable @next/next/no-img-element */
import { Dialog, Transition } from '@headlessui/react'
import { XIcon } from '@heroicons/react/outline'
import { ButtonProps } from '@supabase/ui/dist/cjs/components/Button/Button'
import React, { Fragment, useCallback, useEffect, useState } from 'react'

import { StepperContainer } from '@/mods/shared/components/Stepper'
import {
  IStepperProps,
  Stepper,
} from '@/mods/shared/components/Stepper/Stepper'
import { classes } from '@/mods/shared/helpers/classes'
import { Button, Text, Title } from '@/ui'

interface Props {
  close: () => void
  isOpen: boolean
  title: string
  description?: string
  saveButtonProps?: ButtonProps
  cancelButtonProps?: ButtonProps
  stepper?: Omit<IStepperProps, 'goToStep' | 'activeIndex'>
}

export const Panel: React.FC<Props> = ({
  isOpen,
  close,
  children,
  title,
  description,
  saveButtonProps,
  cancelButtonProps,
  stepper,
}) => {
  const [step, setStep] = useState(0)

  const onNext = useCallback(() => setStep(step + 1), [step])
  const onBack = useCallback(() => setStep(step - 1), [step])

  const goToStep = useCallback(
    (step: number) => {
      if (saveButtonProps?.disabled) return

      setStep(step)
    },
    [saveButtonProps]
  )

  const onBackButtonClick = useCallback(() => {
    if (step === 0) return close()

    onBack()
  }, [onBack, close, step])

  const onNextButtonClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (
        saveButtonProps?.onClick &&
        stepper &&
        step === stepper.steps.length - 1
      ) {
        return saveButtonProps?.onClick(e)
      }

      onNext()
    },
    [onNext, stepper, saveButtonProps, step]
  )

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setStep(0), 200)
    }
  }, [isOpen])

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="dark z-20 fixed inset-0 overflow-hidden"
        onClose={close}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Dialog.Overlay className="absolute inset-0 bg-gray-800 bg-opacity-50" />

          <div className="fixed inset-y-0 right-0 pl-10 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <div className="w-screen bg-gray-600 flex-1 relative flex overflow-hidden">
                {stepper && (
                  <aside className="py-6 pt-12 hidden relative xl:flex xl:flex-col flex-shrink-0 w-96 overflow-y-auto bg-gray-800">
                    <div className="mx-auto">
                      <Title level={3} className="mb-8">
                        Advance Options
                      </Title>

                      <Stepper
                        {...{ ...stepper, goToStep, activeIndex: step }}
                      />
                    </div>
                  </aside>
                )}
                <div className="max-w-4xl w-full mx-auto min-w-0 h-full flex flex-col">
                  <div
                    className={classes(
                      'min-h-0 flex-1 flex flex-col pt-8 pb-6',
                      stepper ? '' : 'justify-center'
                    )}
                  >
                    <div className="px-4 sm:px-6 max-w-2xl">
                      <div className="flex items-start justify-between">
                        <div>
                          <img
                            className="block h-10 w-auto mb-8"
                            src="/isotipo.svg"
                            alt="Fonoster"
                          />
                          <Title level={3} className="mb-6">
                            {title}
                          </Title>

                          {description && (
                            <Text className="mb-6">{description}</Text>
                          )}
                        </div>

                        <div className="ml-4 h-7 flex items-center absolute right-8 top-8">
                          <button
                            type="button"
                            className="bg-gray-600 rounded-md text-gray-200 focus:outline-none"
                            onClick={close}
                            data-intent={title}
                          >
                            <span className="sr-only">Close panel</span>
                            <XIcon className="h-8 w-8" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative px-4 sm:px-6 overflow-y-auto">
                      {stepper ? (
                        <StepperContainer
                          activeIndex={step}
                          {...{ children }}
                        />
                      ) : (
                        <div
                          className="h-full"
                          aria-hidden="true"
                          {...{ children }}
                        />
                      )}
                    </div>
                  </div>
                  {saveButtonProps && (
                    <div className="flex-shrink-0 px-8 pt-6 pb-8 flex justify-end">
                      {stepper ? (
                        <>
                          <Button
                            type="secondary"
                            onClick={onBackButtonClick}
                            data-intent={title}
                          >
                            {step > 0 ? 'Back' : 'Cancel'}
                          </Button>
                          <Button
                            className="ml-4"
                            data-intent={title}
                            {...saveButtonProps}
                            onClick={onNextButtonClick}
                          >
                            {step === stepper.steps.length - 1
                              ? saveButtonProps.children
                              : 'Continue'}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="secondary"
                            onClick={close}
                            data-intent={title}
                            {...{
                              ...cancelButtonProps,
                              children: cancelButtonProps?.children ?? 'Cancel',
                            }}
                          />
                          <Button
                            className="ml-4"
                            data-intent={title}
                            {...saveButtonProps}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
