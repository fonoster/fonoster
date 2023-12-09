import type { CreateSecretRequest } from '@fonoster/secrets/dist/client/types'
import { useCallback, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Notifier } from '@/mods/shared/components/Notification'
import { wait } from '@/mods/shared/helpers/wait'
import { Checkbox, Input, Panel, Select } from '@/ui'
import { Json } from '@/ui/JsonViewer'

import { useCreateSecret } from '../../hooks/useCreateSecret'
import { useCreationEditingSecret } from './useCreationEditingSecret'

export enum SecretType {
  TEXT = 'TEXT',
  JSON = 'JSON',
}

export const secretTypes = Object.values(SecretType)

export const CreationEditingSecret: React.FC = () => {
  const [secretType, setSecretType] = useState<string>(SecretType.TEXT)
  const [showPreview, setShowPreview] = useState<boolean>(true)

  const { isOpen, defaultValues, close } = useCreationEditingSecret()
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateSecretRequest>({ defaultValues })

  const { mutate: create, isLoading } = useCreateSecret()

  const onClose = useCallback(() => {
    close()
    wait(reset)
    wait(() => setSecretType(SecretType.TEXT))
  }, [close, reset])

  const isJsonValue = useCallback((value: string) => {
    try {
      const json = JSON.parse(value)

      if (json && Object.keys(json).length === 0) return false
    } catch (e) {
      return false
    }

    return true
  }, [])

  const onSave = useCallback(
    (secret: CreateSecretRequest) => {
      if (secretType === SecretType.JSON && !isJsonValue(secret.secret)) {
        return Notifier.error('Oops! Your JSON is not valid.')
      }

      if (secretType === SecretType.TEXT && isJsonValue(secret.secret)) {
        return Notifier.error(
          'Oops! Your Secret Type is TEXT but your value is a JSON, please change the Secret Type to JSON.'
        )
      }

      create(secret, {
        onSuccess() {
          onClose()

          Notifier.success('Your new Secret has been successfully created.')
        },
      })
    },
    [create, onClose, isJsonValue, secretType]
  )

  const json = watch('secret')

  return (
    <Panel
      close={onClose}
      isOpen={isOpen}
      title="Create an encrypted variable for your Voice Applications. "
      description="Your secrets are only available for use within this Project."
      saveButtonProps={{
        children: 'Create Secret',
        loading: isLoading,
        onClick: handleSubmit(onSave),
      }}
    >
      <Select
        className="mb-4"
        label="Select Secret Type"
        disabled={isLoading}
        value={secretType}
        onChange={({ target: { value } }) => setSecretType(value)}
      >
        {secretTypes.map(secret => (
          <Select.Option key={secret} value={secret}>
            {secret}
          </Select.Option>
        ))}
      </Select>

      <Controller
        name="name"
        control={control}
        rules={{
          required: true,
          pattern: {
            value: /^([a-zA-Z0-9][^*/><?\|:]*)$/,
            message: 'Secret name must not contain special characters.',
          },
        }}
        render={({ field: { name, onBlur, onChange, value } }) => (
          <Input
            className="mb-4"
            label="Secret name"
            placeholder="Type a friendly name"
            disabled={isLoading}
            descriptionText="Friendly name (e.g. PERSONAL_ACCESS_TOKEN)"
            error={
              errors?.name &&
              (errors.name.message ??
                'You must enter a name for your Secret, try something friendly.')
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
        rules={{ required: true }}
        render={({ field: { name, onBlur, onChange, value } }) => (
          <Input.TextArea
            className="mb-4"
            rows={secretType === SecretType.JSON ? 6 : 2}
            label={
              secretType === SecretType.JSON ? 'Secret JSON' : 'Secret value'
            }
            placeholder="Type a secret value"
            disabled={isLoading}
            error={errors?.secret && 'You must enter a secret value.'}
            {...{
              name,
              onBlur,
              onChange,
              value,
            }}
          />
        )}
      />

      <Checkbox
        label="Show Preview (JSON only)"
        description="Preview your JSON before saving it."
        disabled={isLoading}
        checked={Boolean(showPreview)}
        onChange={() => setShowPreview(!showPreview)}
      />

      {secretType === SecretType.JSON && showPreview && (
        <Json data={isJsonValue(json) ? JSON.parse(json) : {}} bg="#2b2e35" />
      )}
    </Panel>
  )
}
