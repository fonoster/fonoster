const host = process.env.DS_AUTH_HOST || 'localhost'
const port = process.env.DS_AUTH_PORT || 27017
export const db = `mongodb://${host}:${port}/fonos`
