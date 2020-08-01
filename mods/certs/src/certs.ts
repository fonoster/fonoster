import fs from 'fs'
import jwt from 'jsonwebtoken'
import { forge } from 'acme-client'
import { join } from 'path'
import { homedir } from 'os'

const BASE_DIR = join(homedir(), '.fonos')
const PATH_TO_SALT = join(BASE_DIR, 'jwt.salt')
const PATH_TO_CONFIG = join(BASE_DIR, 'config')
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID || 'fonos'
const ISS = process.env.ISS || 'fonos'

if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR)

const getSalt = () =>
  fs
    .readFileSync(PATH_TO_SALT)
    .toString()
    .trim()
const configExist = () => fs.existsSync(PATH_TO_CONFIG)
const saltExist = () => fs.existsSync(PATH_TO_SALT)

async function createAccessFile () {
  if (!saltExist()) {
    fs.writeFileSync(PATH_TO_SALT, await forge.createPrivateKey())
  }

  const salt = getSalt()
  const claims = { ISS, sub: ACCESS_KEY_ID }
  const config = {
    accessKeyId: ACCESS_KEY_ID,
    accessKeySecret: jwt.sign(claims, salt)
  }
  fs.writeFileSync(PATH_TO_CONFIG, JSON.stringify(config, null, ' '))
  return config
}

export {
  createAccessFile as default,
  getSalt,
  configExist,
  saltExist,
  PATH_TO_SALT,
  PATH_TO_CONFIG,
  ACCESS_KEY_ID,
  ISS
}
