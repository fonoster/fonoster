'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const RoutrClient = require('../common/routr_client')
const host = process.env.SIPPROXY_HOST || 'localhost'
const port = process.env.SIPPROXY_API_PORT || '4567'
const username = process.env.SIPPROXY_API_USERNAME || 'admin'
const secret = process.env.SIPPROXY_API_SECRET || 'changeit'
const apiUrl = `https://${host}:${port}/api/v1beta1`
module.exports = new RoutrClient(apiUrl, username, secret)
//# sourceMappingURL=routr.js.map
