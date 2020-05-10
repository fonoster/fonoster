process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

/**
 * Oversimplified version of a Routr API Client
 */
class RoutrClient {
  axios = require('axios')
  logger = require('./logger')
  handleError = require('./routr_errors')
  apiUrl: any
  username: any
  secret: any
  token: any
  resource: any
  constructor (apiUrl, username, secret) {
    this.logger.log('debug', `@yaps/core RoutrClient [creating instance]`)
    this.logger.log('debug', `@yaps/core RoutrClient [apiUrl: ${apiUrl}]`)
    this.apiUrl = apiUrl
    this.username = username
    this.secret = secret
  }

  async connect () {
    this.logger.log('debug', `@yaps/core RoutrClient [connecting]`)
    this.token = await this.getToken(this.username, this.secret)
    this.logger.log('debug', `@yaps/core RoutrClient [token: ${this.token}]`)
  }

  resourceType (resource) {
    this.resource = resource
    return this
  }

  async getToken (username, password) {
    const btoa = require('btoa')
    try {
      const response = await this.axios
        .create({
          baseURL: `${this.apiUrl}/token`,
          headers: { Authorization: `Basic ${btoa(username + ':' + password)}` }
        })
        .get()
      return response.data.data
    } catch (err) {
      this.handleError(err)
    }
  }

  async list (params = {}) {
    const queryParams = p => Object.keys(p).map(k => `${k}=${p[k]}`)
    try {
      const url = `${this.apiUrl}/${this.resource}?token=${
        this.token
      }&filter=*&${queryParams(params).join('&')}`
      const response = await this.axios.get(url)
      return response.data
    } catch (err) {
      this.handleError(err)
    }
  }

  async get (ref) {
    ref = ref ? `/${ref}` : ''
    try {
      const response = await this.axios.get(
        `${this.apiUrl}/${this.resource}${ref}?token=${this.token}`
      )
      return response.data.data
    } catch (err) {
      this.handleError(err)
    }
  }

  async delete (ref) {
    ref = ref ? `/${ref}` : ''
    try {
      return await this.axios.delete(
        `${this.apiUrl}/${this.resource}${ref}?token=${this.token}`
      )
    } catch (err) {
      this.handleError(err)
    }
  }

  async create (data) {
    try {
      const response = await this.axios.post(
        `${this.apiUrl}/${this.resource}?token=${this.token}`,
        data
      )
      return response.data.data
    } catch (err) {
      this.handleError(err)
    }
  }

  async update (data) {
    try {
      const ref = data.metadata.ref
      const response = await this.axios.put(
        `${this.apiUrl}/${this.resource}/${ref}?token=${this.token}`,
        data
      )
      return response.data.data
    } catch (err) {
      this.handleError(err)
    }
  }
}

module.exports = RoutrClient
