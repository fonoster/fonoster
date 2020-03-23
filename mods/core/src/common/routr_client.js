const axios = require('axios')
const btoa = require('btoa')

/**
 * Oversimplified version of a Routr API Client
 */
class Routr {
  constructor (apiUrl) {
    // TODO: Only for testing
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    this.apiUrl = apiUrl
  }

  withToken (token) {
    this.token = token
    return this
  }

  forResource (resource) {
    this.resource = resource
    return this
  }

  async getToken (username, password) {
    return await axios
      .create({
        baseURL: `${this.apiUrl}/token`,
        headers: { Authorization: `Basic ${btoa(username + ':' + password)}` }
      })
      .get()
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

module.exports = Routr
