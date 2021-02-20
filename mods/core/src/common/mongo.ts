import mongoose from 'mongoose'
import logger from '@fonos/logger'

const host = process.env.DS_AUTH_HOST || 'localhost'
const port = process.env.DS_AUTH_PORT || 27017
const dbname = process.env.DS_AUTH_DB || 'fonos'
const credentials = process.env.DS_AUTH_USERNAME && process.env.DS_SECRET  
    ? `${process.env.DS_AUTH_USERNAME}:${process.env.DS_SECRET}@` : ''
export const db = `mongodb://${credentials}${host}:${port}/${dbname}`

console.log('db:', db)

export const mongoConnection = () => {
    mongoose
        .connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true, autoIndex: false })
        .then(() => {
            return logger.info(`Successfully connected to ${db}`)
        })
        .catch(error => {
            logger.error('Error connecting to database: ', error)
            return process.exit(1)
        })
}
