import { FolderIcon } from '@heroicons/react/solid'
import { useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { Notifier } from '@/mods/shared/components/Notification'
import { wait } from '@/mods/shared/helpers/wait'
import { Panel } from '@/ui'

import { useCreateApp } from '../../hooks/useCreateApp'
import { useEditApp } from '../../hooks/useEditApp'
import { AdvanceOptionsStep, GeneralStep, SpeechStep } from './steps'
import { IntentsEngineStep } from './steps/IntentsEngineStep'
import { useCreationEditingApp } from './useCreationEditingApp'

export const CreationEditingApp: React.FC = () => {
  const { isOpen, isEdit, defaultValues, close } = useCreationEditingApp()
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm({ defaultValues, mode: 'onChange' })

  useEffect(() => {
    reset(
      isEdit
        ? defaultValues
        : {
            activationTimeout: 10_000,
            interactionTimeout: 10_000,
            transferConfig: {
              message: 'Please wait while we transfer you',
            },
          }
    )
  }, [isEdit, defaultValues, reset])

  const { mutate: create, isLoading: isCreateLoading } = useCreateApp()
  const { mutate: edit, isLoading: isEditLoading } = useEditApp()

  const isLoading = useMemo(
    () => isCreateLoading || isEditLoading,
    [isCreateLoading, isEditLoading]
  )

  const onClose = useCallback(() => {
    close()
    wait(reset)
  }, [close, reset])

  const onSave = useCallback(
    application => {
      isEdit
        ? edit(application, {
            onSuccess() {
              onClose()

              Notifier.success('Your Application has been successfully edited.')
            },
          })
        : create(application, {
            onSuccess() {
              onClose()

              Notifier.success(
                'Your new Application has been successfully created.'
              )
            },
          })
    },
    [create, edit, isEdit, onClose]
  )

  const headings = useMemo(
    () => ({
      title: isEdit
        ? 'Edit the Application'
        : 'Create a Programmable Voice Application to connect your Telephony infrastructure with your Dialogflow Agents.',
      description: 'Configure your Intents Engine and Speech API.',
      buttonText: isEdit ? 'Save' : 'Create App',
    }),
    [isEdit]
  )

  return (
    <Panel
      close={onClose}
      isOpen={isOpen}
      title={headings.title}
      description={headings.description}
      saveButtonProps={{
        children: headings.buttonText,
        loading: isLoading,
        onClick: handleSubmit(onSave),
        disabled: !isValid,
      }}
      stepper={{
        steps: [
          {
            name: 'General',
            icon: FolderIcon,
          },
          {
            name: 'Speech Config',
            icon: FolderIcon,
          },
          {
            name: 'Intents Engine',
            icon: FolderIcon,
          },
          {
            name: 'Advance Options',
            icon: FolderIcon,
          },
        ],
      }}
    >
      <GeneralStep {...{ control, errors, isLoading }} />
      <SpeechStep
        {...{ control, errors, isLoading, watch, onClose, isEdit, isOpen }}
      />
      <IntentsEngineStep {...{ control, errors, isLoading, isEdit, isOpen }} />
      <AdvanceOptionsStep {...{ control, errors, isLoading }} />
    </Panel>
  )
}
