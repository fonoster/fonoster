import { Controller } from 'react-hook-form'

import { StepContent } from '@/mods/shared/components/Stepper/Step'
import { Input } from '@/ui'

interface IStepProps {
  control: any
  errors: any
  isLoading: boolean
}

export const GeneralStep: React.FC<IStepProps> = ({
  control,
  isLoading,
  errors,
}) => (
  <StepContent>
    <Controller
      name="name"
      control={control}
      rules={{ required: true }}
      render={({ field: { name, onBlur, onChange, value } }) => (
        <Input
          className="mb-4"
          label="Application Name"
          placeholder="Type a friendly name"
          disabled={isLoading}
          error={
            errors?.name &&
            'You must enter a name for your Application, try something friendly.'
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
  </StepContent>
)
