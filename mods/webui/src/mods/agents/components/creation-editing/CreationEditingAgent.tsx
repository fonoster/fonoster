import type { Agent } from '@fonoster/agents/dist/client/types'
import { useCallback, useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Privacy } from '@/@types/Fonoster'
import { useCreationEditingDomain } from '@/mods/domains/components/creation-editing'
import { useDomains } from '@/mods/domains/hooks/useDomains'
import { Notifier } from '@/mods/shared/components/Notification'
import { wait } from '@/mods/shared/helpers/wait'
import { Button, Input, Panel, Radio, Select, Spinner } from '@/ui'

import { useCreateAgent } from '../../hooks/useCreateAgent'
import { useEditAgent } from '../../hooks/useEditAgent'
import { useCreationEditingAgent } from './useCreationEditingAgent'

export const CreationEditingAgent = () => {
  const { isOpen, isEdit, defaultValues, close } = useCreationEditingAgent()
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Agent>({ defaultValues })

  useEffect(() => {
    reset(isEdit ? defaultValues : { privacy: Privacy.PRIVATE })
  }, [isEdit, defaultValues, reset])

  const { mutate: create, isLoading: isCreateLoading } = useCreateAgent()
  const { mutate: edit, isLoading: isEditLoading } = useEditAgent()

  const isLoading = useMemo(
    () => isCreateLoading || isEditLoading,
    [isCreateLoading, isEditLoading]
  )

  const { domains, isSuccess } = useDomains()
  const { open } = useCreationEditingDomain()

  const onClose = useCallback(() => {
    close()
    wait(reset)
  }, [close, reset])

  const onSave = useCallback(
    (data: Agent) => {
      const agent = { ...data, domains: [data.domains as any] }

      isEdit
        ? edit(agent, {
            onSuccess() {
              onClose()

              Notifier.success('Your Agent has been successfully edited.')
            },
          })
        : create(agent, {
            onSuccess() {
              onClose()

              Notifier.success('Your new Agent has been successfully created.')
            },
          })
    },
    [create, edit, isEdit, onClose]
  )

  const hasDomains = useMemo(() => domains.length !== 0, [domains])

  const headings = useMemo(
    () => ({
      title: isEdit
        ? 'Edit the SIP Agent'
        : 'Create a SIP Agent for your internal communications.',
      description:
        'SIP Agents in the same Domain can call each other with Voice Over IP using a Software Phone (e.g Zoiper)',
      buttonText: isEdit ? 'Save' : 'Create Agent',
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
      {isSuccess ? (
        <>
          <Controller
            name="name"
            control={control}
            rules={{ required: true }}
            render={({ field: { name, onBlur, onChange, value } }) => (
              <Input
                className="mb-4"
                label="Your name"
                placeholder="Type a friendly name"
                disabled={isLoading}
                error={
                  errors?.name &&
                  'You must enter a name for your Agent, try something friendly.'
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

          {!isEdit && (
            <>
              <Controller
                name="domains"
                control={control}
                rules={{ required: true }}
                render={({ field: { name, onBlur, onChange, value } }) => (
                  <Select
                    className={hasDomains ? 'mb-4' : 'mb-0'}
                    label="Domain"
                    placeholder="Choose a Domain"
                    disabled={!hasDomains || isLoading}
                    error={
                      !hasDomains
                        ? 'Before adding a Agent you must create a Domain'
                        : errors?.domains && 'You must enter a Domain'
                    }
                    {...{
                      name,
                      onBlur,
                      onChange,
                      value,
                    }}
                  >
                    <Select.Option value="">Choose a Domain</Select.Option>
                    {domains.map(({ ref, name, domainUri }) => (
                      <Select.Option key={ref} value={domainUri}>
                        {name} ({domainUri})
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />

              {!hasDomains && (
                <Button
                  type="secondary"
                  block
                  className="mb-4"
                  onClick={() => {
                    onClose()

                    open()
                  }}
                >
                  Add Domain
                </Button>
              )}

              <Controller
                name="username"
                control={control}
                rules={{ required: true }}
                render={({ field: { name, onBlur, onChange, value } }) => (
                  <Input
                    className="mb-4"
                    label="Your username"
                    placeholder="Type the username"
                    disabled={isLoading}
                    error={
                      errors?.username &&
                      'You must enter a username for your Agent, try something friendly.'
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
            </>
          )}

          <Controller
            name="secret"
            control={control}
            rules={{ required: !isEdit }}
            render={({ field: { name, onBlur, onChange, value } }) => (
              <Input
                className="mb-4"
                label={isEdit ? 'Your new secret' : 'Your secret'}
                placeholder="Type a secret"
                descriptionText={
                  isEdit
                    ? 'If you want to update your secret, just type the new one here.'
                    : ''
                }
                disabled={isLoading}
                type="password"
                error={
                  errors?.secret && 'You must enter a secret for your Agent.'
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
            name="privacy"
            control={control}
            rules={{ required: true }}
            render={({ field: { name, onBlur, onChange, value } }) => (
              <Radio.Group
                className="mb-4"
                type="cards"
                label="Privacy"
                {...{
                  name,
                  onBlur,
                  onChange,
                  value,
                }}
              >
                <Radio
                  label="None"
                  value="none"
                  checked={value === 'none'}
                  disabled={isLoading}
                />
                <Radio
                  label="Private"
                  value="private"
                  checked={value === 'private'}
                  disabled={isLoading}
                />
              </Radio.Group>
            )}
          />
        </>
      ) : (
        <Spinner />
      )}
    </Panel>
  )
}
