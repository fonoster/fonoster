const colors = {
  error: 'red',
  success: 'green',
  warning: 'yellow',
}

export const getStatus = (data?: string | unknown) => {
  const message = `${data ?? 'Unknown'}`

  const status =
    message === 'Unknown'
      ? 'warning'
      : message === 'completed'
      ? 'success'
      : 'error'

  return {
    message,
    status,
    color: colors[status],
  }
}

export const getLevel = (data?: string | unknown) => {
  const message = `${data ?? 'Unknown'}`
  const status = message === 'Unknown' ? 'warning' : message

  return {
    message,
    status,
    color: colors[status],
  }
}
