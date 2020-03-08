const jwt = require('njwt')
const fs = require('fs')
const path = require('path')

// Getting SALT
const pathToSalt = path.join(__dirname, '..', 'certs', 'jwt.salt')
const result = fs.readFileSync(pathToSalt).toString().trim()

// TODO: Read this from stdin or a file
const claims = { iss: 'yaps', sub: 'quijote' }
const token = jwt.create(claims, result)
// token.setExpiration(new Date().getTime() + 3600*1000)
console.log(token.compact())
