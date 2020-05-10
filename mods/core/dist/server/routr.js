var RoutrClient = require('../common/routr_client')
var apiUrl =
  'https://' +
  process.env.SIPPROXY_HOST +
  ':' +
  process.env.SIPPROXY_API_PORT +
  '/api/v1beta1'
var username = process.env.SIPPROXY_API_USERNAME
var secret = process.env.SIPPROXY_API_SECRET
module.exports = new RoutrClient(apiUrl, username, secret)
//# sourceMappingURL=routr.js.map
