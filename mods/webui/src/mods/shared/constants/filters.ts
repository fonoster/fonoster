export const TIMES = [
  {
    label: 'Last 5 minutes',
    value: 'now-5m/h',
  },
  {
    label: 'Last 1 hour',
    value: 'now-1h/d',
  },
  {
    label: 'Last 24 hours',
    value: 'now-1d/d',
  },
  {
    label: 'Last 30 days',
    value: 'now-30d/d',
  },
]

export const validateTimeFilter = (time: string) => {
  if (!TIMES.some(t => t.value === time))
    throw new Error('The time parameter is not valid')
}

export type Time = {
  label: string
  value: string
}
