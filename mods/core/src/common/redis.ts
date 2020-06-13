import Redis from 'ioredis'
const host = process.env.DS_HOST || 'localhost'
const port = process.env.DS_PORT || 6379
export = new Redis(`redis://${host}:${port}`)
