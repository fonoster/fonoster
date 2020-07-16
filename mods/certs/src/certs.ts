import fs from 'fs'
import jwt from 'jsonwebtoken'
import { forge } from 'acme-client'
import { join } from 'path'
import { homedir } from 'os'

const PATH_TO_CONFIG = join(homedir(), '.fonos')
const PATH_TO_SALT = join(PATH_TO_CONFIG, 'jwt.salt')
const PATH_TO_ACCESS = join(PATH_TO_CONFIG, 'access')
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID || 'fonos'
const ISS = process.env.ISS || 'fonos'

if (!fs.existsSync(PATH_TO_CONFIG)) fs.mkdirSync(PATH_TO_CONFIG)

const getSalt = () =>
  fs
    .readFileSync(PATH_TO_SALT)
    .toString()
    .trim()
const accessExist = () => fs.existsSync(PATH_TO_ACCESS)
const saltExist = () => fs.existsSync(PATH_TO_SALT)

async function createAccessFile () {
  if (!saltExist()) {
    fs.writeFileSync(PATH_TO_SALT, await forge.createPrivateKey())
  }

  const salt = getSalt()
  const claims = { ISS, sub: ACCESS_KEY_ID }
  const access = {
    accessKeyId: ACCESS_KEY_ID,
    accessKeySecret: jwt.sign(claims, salt)
  }
  fs.writeFileSync(PATH_TO_ACCESS, JSON.stringify(access, null, ' '))
  return access
}

export {
  createAccessFile as default,
  getSalt,
  accessExist,
  saltExist,
  PATH_TO_SALT,
  PATH_TO_CONFIG,
  PATH_TO_ACCESS,
  ACCESS_KEY_ID,
  ISS
}
