const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const os = require('os')
const acme = require('acme-client')

const pathToYAPSConfig = path.join(os.homedir(), '.yaps')
const pathToSalt = path.join(pathToYAPSConfig, 'jwt.salt')
const pathToAccess = path.join(pathToYAPSConfig, 'access')
const accessKeyId = 'yaps' // WARNING: Fix hardcode
const iss = 'yaps' // WARNING: Fix hardcode

if (!fs.existsSync(pathToYAPSConfig)) fs.mkdirSync(pathToYAPSConfig)

const saltExist = () => fs.existsSync(pathToSalt)
const getSalt = () =>
  fs
    .readFileSync(pathToSalt)
    .toString()
    .trim()
const accessExist = () => fs.existsSync(pathToAccess)
const createSaltFile = async () =>
  fs.writeFileSync(pathToSalt, await acme.forge.createPrivateKey())

async function createAccessFile () {
  if (!saltExist()) await createSaltFile()

  const salt = getSalt()
  const claims = { iss, sub: accessKeyId }
  const access = {
    accessKeyId: accessKeyId,
    accessKeySecret: jwt.sign(claims, salt)
  }
  fs.writeFileSync(pathToAccess, JSON.stringify(access, null, ' '))
}

module.exports.saltExist = saltExist
module.exports.getSalt = getSalt
module.exports.accessExist = accessExist
module.exports.createSaltFile = createSaltFile
module.exports.createAccessFile = createAccessFile
