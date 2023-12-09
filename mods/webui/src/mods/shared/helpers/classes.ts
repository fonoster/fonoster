export const classes = (...classnames: unknown[]) =>
  classnames.filter(Boolean).join(' ')
