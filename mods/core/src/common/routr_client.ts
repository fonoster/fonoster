export {}

const axios = require('axios')
const logger = require('./logger')
const btoa = require('btoa')
const handleError = require('./routr_errors')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

/**
 * Oversimplified version of a Routr API Client
 */
class RoutrClient {

  apiUrl: string
  username: string
  secret: string
  token: string
  resource: string

  constructor (apiUrl: string, username: string, secret: string) {
    logger.log('debug', `@yaps/core RoutrClient [creating instance]`)
    logger.log('debug', `@yaps/core RoutrClient [apiUrl: ${apiUrl}]`)
    this.apiUrl = apiUrl
    this.username = username
    this.secret = secret
  }

  async connect () {
    logger.log('debug', `@yaps/core RoutrClient [connecting]`)
    this.token = await this.getToken(this.username, this.secret)
    logger.log('debug', `@yaps/core RoutrClient [token: ${this.token}]`)
  }

  resourceType (resource: string) {
    this.resource = resource
    return this
  }

  private async getToken (username:string, password: string) {
    try {
      const response = await axios
        .create({
          baseURL: `${this.apiUrl}/token`,
          headers: { Authorization: `Basic ${btoa(username + ':' + password)}` }
        })
        .get()
      return response.data.data
    } catch (err) {
      handleError(err)
    }
  }

  async list (params: object | {}) {
    const queryParams = (p: object) => Object.keys(p).map(k => `${k}=${p[k]}`)
    try {
      const url = `${this.apiUrl}/${this.resource}?token=${
        this.token
      }&filter=*&${queryParams(params).join('&')}`
      const response = await axios.get(url)
      return response.data
    } catch (err) {
      handleError(err)
    }
  }

  async get (ref: string) {
    ref = ref ? `/${ref}` : ''
    try {
      const response = await axios.get(
        `${this.apiUrl}/${this.resource}${ref}?token=${this.token}`
      )
      return response.data.data
    } catch (err) {
      handleError(err)
    }
  }

  async delete (ref: string) {
    ref = ref ? `/${ref}` : ''
    try {
      return await axios.delete(
        `${this.apiUrl}/${this.resource}${ref}?token=${this.token}`
      )
    } catch (err) {
      handleError(err)
    }
  }

  async create (data: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.resource}?token=${this.token}`,
        data
      )
      return response.data.data
    } catch (err) {
      handleError(err)
    }
  }

  async update (data: any) {
    try {
      const ref = data.metadata.ref
      const response = await axios.put(
        `${this.apiUrl}/${this.resource}/${ref}?token=${this.token}`,
        data
      )
      return response.data.data
    } catch (err) {
      handleError(err)
    }
  }
}

module.exports = RoutrClient
