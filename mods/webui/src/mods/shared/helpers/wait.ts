export const wait = (fn: Function, ms = 500) => setTimeout(fn, ms)

export const sleep = (ms = 1000) =>
  new Promise(resolve => setTimeout(resolve, ms))
