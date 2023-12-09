import { useEffect, useMemo } from 'react'
import { Controller, UseFormWatch } from 'react-hook-form'
import InfiniteScroll from 'react-infinite-scroll-component'

import { useCreationEditingSecret } from '@/mods/secrets/components/creation-editing'
import { useSecrets } from '@/mods/secrets/hooks/useSecrets'
import { StepContent } from '@/mods/shared/components/Stepper/Step'
import { wait } from '@/mods/shared/helpers/wait'
import { useVoices } from '@/mods/shared/hooks/useVoices'
import { Button, Label, Radio, Select, Text } from '@/ui'

interface IStepProps<
  W extends UseFormWatch<{
    speechConfig: {
      voice: string
    }
  }> = any
> {
  control: any
  errors: any
  isLoading: boolean
  isEdit: boolean
  isOpen: boolean
  watch: W
  onClose: () => void
}

export const SpeechStep: React.FC<IStepProps> = ({
  control,
  isLoading,
  errors,
  watch,
  isEdit,
  onClose,
  isOpen,
}) => {
  const {
    voices,
    total,
    fetchMoreVoices,
    hasMoreVoices,
    getAudio,
    resetVoices,
  } = useVoices()

  const { open } = useCreationEditingSecret()

  const { secrets, isSuccess } = useSecrets()
  const hasSecrets = useMemo(
    () => secrets.length !== 0 && isSuccess,
    [secrets, isSuccess]
  )

  useEffect(() => {
    if (!isOpen) {
      wait(resetVoices)
    }
  }, [isOpen, resetVoices])

  return (
    <StepContent>
      <>
        <Controller
          name="speechConfig.secretName"
          control={control}
          rules={{ required: true }}
          render={({ field: { name, onBlur, onChange, value } }) => (
            <Select
              className={hasSecrets ? 'mb-4' : 'mb-0'}
              label="Speech Config Secret"
              disabled={!hasSecrets || isLoading || !isSuccess}
              error={
                !hasSecrets && isSuccess
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
              {secrets.map(({ name }) => (
                <Select.Option key={name} value={name}>
                  {name}
                </Select.Option>
              ))}
            </Select>
          )}
        />
        {!hasSecrets && (
          <Button
            type="secondary"
            block
            className="mb-4"
            onClick={() => {
              onClose()

              open()
            }}
          >
            Add Secret
          </Button>
        )}
        <Label>
          {isEdit ? (
            <>
              The current voice is:{' '}
              <strong>{watch('speechConfig.voice')}</strong>
            </>
          ) : (
            'Voice name '
          )}
        </Label>
        <Controller
          name="speechConfig.voice"
          control={control}
          rules={{ required: true }}
          render={({ field: { name, onBlur, onChange, value } }) => (
            <Radio.Group
              className="mb-4 sbui-input"
              error={
                errors?.speechConfig?.voice &&
                'You must enter a voice for your Application.'
              }
              {...{
                name,
                onBlur,
                onChange,
                value,
              }}
            >
              <InfiniteScroll
                dataLength={total}
                next={fetchMoreVoices}
                hasMore={hasMoreVoices}
                loader={<Text>Loading...</Text>}
                height={300}
              >
                {voices.map(voice => (
                  <div
                    className="flex items-center justify-between p-2 border-b border-gray-500"
                    key={voice}
                  >
                    <Radio
                      label={voice}
                      value={voice}
                      checked={value === voice}
                      disabled={isLoading}
                    />
                    <audio
                      controls
                      preload="none"
                      style={{ maxWidth: '142px' }}
                    >
                      <source {...getAudio(voice)} />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ))}
              </InfiniteScroll>
            </Radio.Group>
          )}
        />
      </>
    </StepContent>
  )
}
