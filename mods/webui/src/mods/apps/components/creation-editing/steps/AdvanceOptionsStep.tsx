import { Controller } from 'react-hook-form'

import { StepContent } from '@/mods/shared/components/Stepper/Step'
import { Checkbox, Input } from '@/ui'

interface IStepProps {
  control: any
  errors: any
  isLoading: boolean
}

export const AdvanceOptionsStep: React.FC<IStepProps> = ({
  control,
  isLoading,
  errors,
}) => (
  <StepContent>
    <Controller
      name="initialDtmf"
      control={control}
      rules={{ pattern: /^[0-9*#]*$/ }}
      render={({ field: { name, onBlur, onChange, value } }) => (
        <Input
          className="mb-4"
          label="Initial DTMF"
          placeholder="It’s a string that allows 1234567890#*"
          disabled={isLoading}
          error={errors?.initialDtmf && 'You must enter valid DTMF'}
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
      name="enableEvents"
      control={control}
      render={({ field: { name, onBlur, onChange, value } }) => (
        <Checkbox
          label="Enable Events"
          description="Supports real-time events through WebSockets"
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

    <Controller
      name="activationIntentId"
      control={control}
      render={({ field: { name, onBlur, onChange, value } }) => (
        <Input
          className="mb-4"
          label="Type the activation intent ID"
          descriptionText="If set it will require the user to say the activation phrase (eg. Hey Alexa) You will typically use this in the browser."
          placeholder="(e.g. HEY_ROX)"
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

    <Controller
      name="activationTimeout"
      control={control}
      render={({ field: { name, onBlur, onChange, value } }) => (
        <Input
          className="mb-4"
          type="number"
          label="Type the activation timeout"
          placeholder="(e.g. 15000)"
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

    <Controller
      name="interactionTimeout"
      control={control}
      render={({ field: { name, onBlur, onChange, value } }) => (
        <Input
          className="mb-4"
          type="number"
          label="Type the interaction timeout"
          placeholder="(e.g. 10000)"
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

    <Controller
      name="transferConfig.message"
      control={control}
      render={({ field: { name, onBlur, onChange, value } }) => (
        <Input.TextArea
          className="mb-4"
          label="Type a transfer message"
          rows={8}
          labelOptional="Plain text to SSML"
          placeholder="(e.g. Please wait while we transfer you)"
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
  </StepContent>
)
