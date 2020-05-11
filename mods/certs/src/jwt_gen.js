const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const os = require('os')
const acme = require('acme-client')

const pathToFonosConfig = path.join(os.homedir(), '.fonos')
const pathToSalt = path.join(pathToFonosConfig, 'jwt.salt')
const pathToAccess = path.join(pathToFonosConfig, 'access')
const accessKeyId = 'fonos' // WARNING: Fix hardcode
const iss = 'fonos' // WARNING: Fix hardcode

if (!fs.existsSync(pathToFonosConfig)) fs.mkdirSync(pathToFonosConfig)

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
  console.log('Creating access file')
  if (!saltExist()) {
    console.log(`No salt found. Creating salt file`)
    await createSaltFile()
  }

  const salt = getSalt()
  const claims = { iss, sub: accessKeyId }
  const access = {
    accessKeyId: accessKeyId,
    accessKeySecret: jwt.sign(claims, salt)
  }
  fs.writeFileSync(pathToAccess, JSON.stringify(access, null, ' '))
  console.log('Access file created')
}

module.exports.saltExist = saltExist
module.exports.getSalt = getSalt
module.exports.accessExist = accessExist
module.exports.createSaltFile = createSaltFile
module.exports.createAccessFile = createAccessFile
