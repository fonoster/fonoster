const RoutrClient = require('../common/routr_client')

const apiUrl = `https://${process.env.SIPPROXY_HOST}:${
  process.env.SIPPROXY_API_PORT
}/api/v1beta1`

const username = process.env.SIPPROXY_API_USERNAME
const secret = process.env.SIPPROXY_API_SECRET

module.exports = new RoutrClient(apiUrl, username, secret)
