import { Text } from '@/ui'

import { classes } from '../../helpers/classes'

export interface IStepperProps {
  goToStep: (step: number) => void
  activeIndex: number
  steps: {
    name: string
    icon: (...attrs) => JSX.Element
  }[]
}

export interface IStepProps {
  index: number
  name: string
  icon: (...attrs) => JSX.Element
  isActive: boolean
  total: number
  onClick: () => void
}

export const Step = (step: IStepProps) => {
  return (
    <li
      key={step.name}
      className={classes(
        step.index !== step.total - 1 ? 'pb-6' : '',
        'relative cursor-pointer'
      )}
      onClick={step.onClick}
    >
      <>
        {step.index !== step.total - 1 ? (
          <div
            className="-ml-px absolute mt-0.5 top-4 left-4 w-0.5 h-full bg-gray-600"
            aria-hidden="true"
          />
        ) : null}
        <a className="relative flex items-start group">
          <span className="h-9 flex items-center" aria-hidden="true">
            <span
              className={classes(
                'relative z-10 w-8 h-8 flex items-center justify-center rounded-full',
                step.isActive ? 'bg-primary' : 'bg-gray-600'
              )}
            >
              <step.icon
                className={classes(
                  'h-4 w-4',
                  step.isActive ? 'text-white' : 'text-gray-400'
                )}
              />
            </span>
          </span>
          <span className="ml-4 min-w-0 flex flex-col">
            <Text className={step.isActive ? '!text-primary' : ''}>
              {step.name}
            </Text>
          </span>
        </a>
      </>
    </li>
  )
}

export const Stepper: React.FC<IStepperProps> = ({
  activeIndex,
  steps,
  goToStep,
}) => (
  <nav aria-label="progress">
    <ol role="list" className="overflow-hidden">
      {steps.map((step, stepIdx) => (
        <Step
          index={stepIdx}
          key={step.name}
          isActive={stepIdx === activeIndex}
          name={step.name}
          icon={step.icon}
          total={steps.length}
          onClick={() => goToStep(stepIdx)}
        />
      ))}
    </ol>
  </nav>
)
