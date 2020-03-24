const axios = require('axios')
const btoa = require('btoa')
const logger = require('./logger')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

/**
 * Oversimplified version of a Routr API Client
 */
class RoutrClient {
  constructor (apiUrl, username, secret) {
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

  resourceType (resource) {
    this.resource = resource
    return this
  }

  async getToken (username, password) {
    const response = await axios
      .create({
        baseURL: `${this.apiUrl}/token`,
        headers: { Authorization: `Basic ${btoa(username + ':' + password)}` }
      })
      .get()
    return response.data.data
  }

  async list (resource) {
    const response = await axios.get(
      `${this.apiUrl}/${this.resource}?token=${this.token}`
    )
    return response.data.data
  }

  async get (ref) {
    ref = ref ? `/${ref}` : ''
    const response = await axios.get(
      `${this.apiUrl}/${this.resource}${ref}?token=${this.token}`
    )
    return response.data.data
  }

  async del (ref) {
    ref = ref ? `/${ref}` : ''
    return await axios.delete(
      `${this.apiUrl}/${this.resource}${ref}?token=${this.token}`
    )
  }

  async create (data) {
    const response = await axios.post(
      `${this.apiUrl}/${this.resource}?token=${this.token}`,
      data
    )
    return response.data.data
  }

  async update (data) {
    const ref = data.metadata.ref
    const response = await axios.put(
      `${this.apiUrl}/${this.resource}/${ref}?token=${this.token}`,
      data
    )
    return response.data.data
  }
}

module.exports = RoutrClient
