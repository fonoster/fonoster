const jwt = require('njwt')
const fs = require('fs')
const path = require('path')

// Getting SALT
const pathToSalt = path.join(process.env.CERTS_PATH, 'jwt.salt')
const result = fs.readFileSync(pathToSalt).toString().trim()

const claims = { iss: 'yaps', sub: process.env.ACCESS_KEY_ID }
const token = jwt.create(claims, result)
// token.setExpiration(new Date().getTime() + 3600*1000)
console.log(`${process.env.ACCESS_KEY_ID}:${token.compact()}`)
