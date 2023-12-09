import { useEffect, useMemo, useState } from 'react'
import { Controller } from 'react-hook-form'

import { useSecrets } from '@/mods/secrets/hooks/useSecrets'
import { StepContent } from '@/mods/shared/components/Stepper/Step'
import { Input, Select } from '@/ui'

interface IStepProps {
  control: any
  errors: any
  isLoading: boolean
  isEdit: boolean
  isOpen: boolean
}

export const IntentsEngineStep: React.FC<IStepProps> = ({
  control,
  isLoading,
  isEdit,
  isOpen,
  errors,
}) => {
  const [intensConfigType, setIntentsConfigType] = useState('')
  const { secrets } = useSecrets()
  const hasSecrets = useMemo(() => secrets.length !== 0, [secrets])

  useEffect(() => {
    if (!isOpen) setIntentsConfigType('')
  }, [isOpen])

  return (
    <StepContent>
      <Controller
        name="intentsEngineConfig.welcomeIntentId"
        control={control}
        render={({ field: { name, onBlur, onChange, value } }) => (
          <Input
            className="mb-4"
            label="Type the welcome intent ID"
            placeholder="(e.g. WELCOME)"
            disabled={isLoading}
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
        <Select
          className="mb-4"
          label="Select Intents Engine Type"
          disabled={isLoading}
          value={intensConfigType}
          onChange={({ target: { value } }) => setIntentsConfigType(value)}
        >
          <Select.Option value="">Choose a Engine</Select.Option>
          {[{ name: 'DialogflowES' }].map(({ name }) => (
            <Select.Option key={name} value={name}>
              {name}
            </Select.Option>
          ))}
        </Select>
      )}

      {(intensConfigType || isEdit) && (
        <>
          <Controller
            name="intentsEngineConfig.projectId"
            control={control}
            rules={{ required: true }}
            render={({ field: { name, onBlur, onChange, value } }) => (
              <Input
                className="mb-4"
                label="Type a project ID"
                placeholder="(e.g my-gcp-project)"
                disabled={isLoading}
                error={
                  errors?.intentsEngineConfig?.projectId &&
                  'You must enter a project ID for your Application.'
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
            name="intentsEngineConfig.secretName"
            control={control}
            rules={{ required: true }}
            render={({ field: { name, onBlur, onChange, value } }) => (
              <Select
                className={hasSecrets ? 'mb-4' : 'mb-0'}
                label="Intents Engine Secret"
                disabled={!hasSecrets || isLoading}
                error={
                  !hasSecrets
                    ? 'Before adding a Application you must create a Secret'
                    : errors?.speechConfig?.secretName &&
                      'You must enter a Secret'
                }
                {...{
                  name,
                  onBlur,
                  onChange,
                  value,
                }}
              >
                <Select.Option value="">Choose a Secret</Select.Option>
                {/* eslint-disable-next-line sonarjs/no-identical-functions */}
                {secrets.map(({ name }) => (
                  <Select.Option key={name} value={name}>
                    {name}
                  </Select.Option>
                ))}
              </Select>
            )}
          />

          {intensConfigType === 'DialogflowCX' && (
            <>
              <Controller
                name="intentsEngineConfig.agent"
                control={control}
                rules={{ required: true }}
                render={({ field: { name, onBlur, onChange, value } }) => (
                  <Input
                    className="mb-4"
                    label="Type a agent"
                    placeholder="(e.g. Joe)"
                    disabled={isLoading}
                    error={
                      errors?.intentsEngineConfig?.agent &&
                      'You must enter a agent'
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
                name="intentsEngineConfig.location"
                control={control}
                rules={{ required: true }}
                render={({ field: { name, onBlur, onChange, value } }) => (
                  <Input
                    className="mb-4"
                    label="Type a location"
                    placeholder="(e.g. ...)"
                    error={
                      errors?.intentsEngineConfig?.location &&
                      'You must enter a location'
                    }
                    disabled={isLoading}
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
        </>
      )}
    </StepContent>
  )
}
