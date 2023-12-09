import { phone } from 'phone'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { useApps } from '@/mods/apps/hooks/useApps'
import { useCreationEditingProvider } from '@/mods/providers/components/creation-editing'
import { useProviders } from '@/mods/providers/hooks/useProviders'
import { Notifier } from '@/mods/shared/components/Notification'
import { classes } from '@/mods/shared/helpers/classes'
import { wait } from '@/mods/shared/helpers/wait'
import { Button, Input, Panel, Select, Spinner } from '@/ui'

import { useCreateNumber } from '../../hooks/useCreateNumber'
import { useEditNumber } from '../../hooks/useEditNumber'
import { PhoneInput, PhoneInputContainer } from '../PhoneInput'
import { useCreationEditingNumber } from './useCreationEditingNumber'

export const CreationEditingNumber = () => {
  const [formattedToE164, setFormattedToE164] = useState('')
  const { isOpen, isEdit, defaultValues, close } = useCreationEditingNumber()
  const {
    reset,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({ defaultValues })

  useEffect(() => {
    reset(isEdit ? defaultValues : {})
  }, [isEdit, defaultValues, reset])

  const { mutate: create, isLoading: isCreateLoading } = useCreateNumber()
  const { mutate: edit, isLoading: isEditLoading } = useEditNumber()

  const isLoading = useMemo(
    () => isCreateLoading || isEditLoading,
    [isCreateLoading, isEditLoading]
  )

  const { providers, isSuccess } = useProviders()
  const { apps, isSuccess: isSuccessApp } = useApps()
  const { open } = useCreationEditingProvider()

  const onClose = useCallback(() => {
    close()
    wait(reset)
  }, [close, reset])

  const onSave = useCallback(
    data => {
      const payload = {
        ...data,
        e164Number: formattedToE164,
      }

      const number = isEdit
        ? {
            ...payload,
            aorLink: undefined,
          }
        : payload

      isEdit
        ? edit(number, {
            onSuccess() {
              onClose()

              Notifier.success('Your Number has been successfully edited.')
            },
          })
        : create(number, {
            onSuccess() {
              onClose()

              Notifier.success('Your new Number has been successfully created.')
            },
          })
    },
    [create, edit, isEdit, onClose, formattedToE164]
  )

  const hasProviders = useMemo(() => providers.length !== 0, [providers])
  const hasApps = useMemo(() => apps.length !== 0, [apps])

  const headings = useMemo(
    () => ({
      title: 'Add a new Number to handle incoming and outgoing calls.',
      description:
        'Use this section to managed your Numbers and control their settings.',
      buttonText: isEdit ? 'Save' : 'Create Number',
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
      {isSuccess && isSuccessApp ? (
        <>
          {!isEdit && (
            <>
              <Controller
                name="providerRef"
                control={control}
                rules={{ required: true }}
                render={({ field: { name, onBlur, onChange, value } }) => (
                  <Select
                    className={hasProviders ? 'mb-4' : 'mb-0'}
                    label="Service Provider"
                    placeholder="Choose a Provider"
                    disabled={!hasProviders || isLoading}
                    error={
                      !hasProviders
                        ? 'Before adding a Number you must create a Provider (trunk)'
                        : errors?.providerRef &&
                          'You must enter a service provider'
                    }
                    {...{
                      name,
                      onBlur,
                      onChange,
                      value,
                    }}
                  >
                    <Select.Option value="">Choose a Provider</Select.Option>
                    {providers.map(({ ref, name }) => (
                      <Select.Option key={ref} value={ref}>
                        {name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />

              {!hasProviders && (
                <Button
                  type="secondary"
                  block
                  className="mb-4"
                  onClick={() => {
                    onClose()

                    open()
                  }}
                >
                  Add Provider
                </Button>
              )}
            </>
          )}

          <Controller
            name="e164Number"
            control={control}
            rules={{ required: true }}
            render={({ field: { name, onBlur, onChange, value } }) => (
              <PhoneInputContainer
                label="E.164 Number"
                error={
                  errors?.e164Number &&
                  'Invalid phone number, please enter a valid phone number with E.164 format (e.g. +17853178070)'
                }
              >
                <PhoneInput
                  country={'us'}
                  enableSearch={true}
                  placeholder="Type a number (e.g. +17853178070)"
                  disabled={isLoading || isEdit}
                  inputClass={classes(
                    'sbui-input',
                    'sbui-input--medium',
                    errors?.e164Number ? 'sbui-input--error' : ''
                  )}
                  searchPlaceholder="Search for a country"
                  {...{
                    name,
                    onBlur,
                    onChange: (phoneNumber, data) => {
                      if (isEdit) return

                      const formattedToE164 = phone(phoneNumber, {
                        country: data['countryCode'],
                        validateMobilePrefix: false,
                      })

                      onChange(phoneNumber)
                      setFormattedToE164(String(formattedToE164.phoneNumber))

                      !formattedToE164.isValid
                        ? setError('e164Number', { type: 'required' })
                        : clearErrors('e164Number')
                    },
                    value,
                  }}
                />
              </PhoneInputContainer>
            )}
          />

          <Controller
            name="ingressInfo.webhook"
            control={control}
            rules={{ required: !hasApps }}
            render={({ field: { name, onBlur, onChange, value } }) => (
              <Input
                className="mb-4"
                label="Webhook URL"
                placeholder="Type a webhook (e.g. https://c5b6-172-22215.ngrok.io)"
                disabled={isLoading}
                error={
                  errors?.ingressInfo?.['webhook'] &&
                  'You must enter a webhook for your Number.'
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
            name="ingressInfo.appRef"
            control={control}
            render={({ field: { name, onBlur, onChange, value } }) => (
              <Select
                className={hasApps ? 'mb-4' : 'mb-0'}
                label="Optional Voice Application"
                placeholder="Choose Application"
                descriptionText="If the webhook parameter is set, we will forward the call to your Voice Application. If no webhook is set, but you select an Application we will connect your call to a managed resource."
                disabled={isLoading}
                error={
                  errors?.ingressInfo?.['appRef'] &&
                  'You must enter a Application'
                }
                {...{
                  name,
                  onBlur,
                  onChange,
                  value,
                }}
              >
                <Select.Option value="">Choose Application</Select.Option>
                {apps.map(({ ref, name }) => (
                  <Select.Option key={ref} value={ref}>
                    {name}
                  </Select.Option>
                ))}
              </Select>
            )}
          />
        </>
      ) : (
        <Spinner />
      )}
    </Panel>
  )
}
