const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')

const pathToCerts = process.env.CERTS_PATH || path.join(__dirname, 'certs')
const accessKeyId = process.env.ACCESS_KEY_ID || 'yaps'

// Getting SALT
const pathToSalt = path.join(pathToCerts, 'jwt.salt')
const privateKey = fs.readFileSync(pathToSalt).toString().trim()

const claims = {
  iss: 'yaps',
  sub: accessKeyId,
  exp: Math.floor(Date.now('2030-01-01') / 1000)
}

console.log(`${accessKeyId}:${jwt.sign(claims, privateKey)}`)
