import type { Provider } from '@fonoster/providers/dist/client/types'
import { useCallback, useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Notifier } from '@/mods/shared/components/Notification'
import { config } from '@/mods/shared/constants/config'
import { wait } from '@/mods/shared/helpers/wait'
import { Checkbox, Input, Panel, Radio } from '@/ui'

import { useCreateProvider } from '../../hooks/useCreateProvider'
import { useEditProvider } from '../../hooks/useEditProvider'
import { useCreationEditingProvider } from './useCreationEditingProvider'

export const CreationEditingProvider: React.FC = () => {
  const { isOpen, isEdit, defaultValues, close } = useCreationEditingProvider()
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Provider>({ defaultValues })

  useEffect(() => {
    reset(
      isEdit
        ? defaultValues
        : {
            expires: 600,
            transport: 'tcp',
            register: false,
          }
    )
  }, [isEdit, defaultValues, reset])

  const { mutate: create, isLoading: isCreateLoading } = useCreateProvider()
  const { mutate: edit, isLoading: isEditLoading } = useEditProvider()

  const isLoading = useMemo(
    () => isCreateLoading || isEditLoading,
    [isCreateLoading, isEditLoading]
  )

  const onClose = useCallback(() => {
    close()
    wait(reset)
  }, [close, reset])

  const onSave = useCallback(
    (provider: Provider) => {
      isEdit
        ? edit(provider, {
            onSuccess() {
              onClose()

              Notifier.success('Your Provider has been successfully edited.')
            },
          })
        : create(provider, {
            onSuccess() {
              onClose()

              Notifier.success('Your new Trunk has been successfully created.')
            },
          })
    },
    [create, edit, isEdit, onClose]
  )

  const headings = useMemo(
    () => ({
      title: isEdit
        ? 'Edit to your Project a SIP Provider to make and receive calls from regular phones'
        : 'Add to your Project a SIP Provider to make and receive calls from regular phones',
      description:
        'Complete the following form with the information given to you by your service provider.',
      buttonText: isEdit ? 'Save' : 'Add Provider',
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
      }}
    >
      <Controller
        name="name"
        control={control}
        rules={{ required: true }}
        render={({ field: { name, onBlur, onChange, value } }) => (
          <Input
            className="mb-4"
            label="Your Provider’s name"
            placeholder="Type a friendly name"
            disabled={isLoading}
            error={
              errors?.name &&
              'You must enter a name for your Provider, try something friendly.'
            }
            {...{
              name,
              onBlur,
              onChange,
              value,
            }}
          />
        )}
      />

      <Controller
        name="username"
        control={control}
        rules={{ required: true }}
        render={({ field: { name, onBlur, onChange, value } }) => (
          <Input
            className="mb-4"
            label="Your username"
            placeholder="Type a username"
            disabled={isLoading}
            error={
              errors?.username && 'You must enter a username for your Provider.'
            }
            {...{
              name,
              onBlur,
              onChange,
              value,
            }}
          />
        )}
      />

      <Controller
        name="secret"
        control={control}
        rules={{ required: !isEdit }}
        render={({ field: { name, onBlur, onChange, value } }) => (
          <Input
            className="mb-4"
            label={isEdit ? 'Your new secret' : 'Your secret'}
            placeholder="Type your secret"
            descriptionText={
              isEdit
                ? 'If you want to update your secret, just type the new one here.'
                : ''
            }
            disabled={isLoading}
            type="password"
            error={
              errors?.secret && 'You must enter a secret for your Provider.'
            }
            {...{
              name,
              onBlur,
              onChange,
              value,
            }}
          />
        )}
      />

      <Controller
        name="host"
        control={control}
        rules={{ required: true }}
        render={({ field: { name, onBlur, onChange, value } }) => (
          <Input
            className="mb-4"
            label="Providers Hostname or IPv4"
            placeholder="Hostname or IPv4"
            disabled={isLoading}
            error={errors?.host && 'You must enter a host for your Provider.'}
            {...{
              name,
              onBlur,
              onChange,
              value,
            }}
          />
        )}
      />

      <Controller
        name="transport"
        control={control}
        render={({ field: { name, onBlur, onChange, value } }) => (
          <Radio.Group
            className="mb-4"
            type="cards"
            label="Transport"
            labelOptional="We recommend TCP"
            {...{
              name,
              onBlur,
              onChange,
              value,
            }}
          >
            <Radio
              label="Transmission Control Protocol (TCP)"
              value="tcp"
              checked={value === 'tcp'}
              disabled={isLoading}
            />
            <Radio
              label="User Datagram Protocol (UDP)"
              value="udp"
              checked={value === 'udp'}
              disabled={isLoading}
            />
          </Radio.Group>
        )}
      />

      {config.APP_FEATURE_FLAG_SEND_REGISTER && (
        <Controller
          name="expires"
          control={control}
          render={({ field: { name, onBlur, onChange, value } }) => (
            <Input
              className="mb-4"
              label="SIP registration refresh (in seconds)"
              placeholder="(e.g. 600)"
              type="number"
              disabled={isLoading}
              error={
                errors?.secret && 'You must enter a expires for your Provider.'
              }
              {...{
                name,
                onBlur,
                onChange,
                value,
              }}
            />
          )}
        />
      )}

      {config.APP_FEATURE_FLAG_SEND_REGISTER && (
        <Controller
          name="register"
          control={control}
          render={({ field: { name, onBlur, onChange, value } }) => (
            <Checkbox
              label="Enable registration"
              description="We will send REGISTER messages to your VoIP Provider."
              disabled={isLoading}
              checked={Boolean(value)}
              className="mb-4"
              {...{
                name,
                onBlur,
                onChange,
              }}
            />
          )}
        />
      )}
    </Panel>
  )
}
