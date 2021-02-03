import Redis from 'ioredis'
const host = process.env.DS_HOST || 'localhost'
const port = process.env.DS_PORT || 6379
const secret = process.env.DS_SECRET ? `:${process.env.DS_SECRET}@` : ''
export = new Redis(`redis://${secret}${host}:${port}`)
