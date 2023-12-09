import { Transition } from '@headlessui/react'
import { Fragment } from 'react'

interface IStepperProps {
  activeIndex: number
}

export const StepperContainer: React.FC<IStepperProps> = ({
  activeIndex = 0,
  children,
}) => {
  const steps = (Array.isArray(children) ? children : [children]).map(
    (child, idx) => (
      <Transition
        key={idx}
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
        show={idx === activeIndex}
      >
        <div className="stepper-item">{child}</div>
      </Transition>
    )
  )

  return <div className="stepper-container" {...{ children: steps }} />
}
