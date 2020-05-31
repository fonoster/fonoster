import fs from 'fs'
import jwt from 'jsonwebtoken'
import { forge } from 'acme-client'
import { join } from 'path'
import { homedir } from 'os'

const PATH_TO_CONFIG = join(homedir(), '.fonos')
const PATH_TO_SALT = join(PATH_TO_CONFIG, 'jwt.salt')
const PATH_TO_ACCESS = join(PATH_TO_CONFIG, 'access')
const ACCESS_KEY_ID = 'fonos' // WARNING: Fix hardcode
const ISS = 'fonos' // WARNING: Fix hardcode

if (!fs.existsSync(PATH_TO_CONFIG)) fs.mkdirSync(PATH_TO_CONFIG)

async function createAccessFile () {
  if (!fs.existsSync(PATH_TO_SALT)) {
    fs.writeFileSync(PATH_TO_SALT, await forge.createPrivateKey())
  }

  const salt = fs
    .readFileSync(PATH_TO_SALT)
    .toString()
    .trim()
  const claims = { ISS, sub: ACCESS_KEY_ID }
  const access = {
    accessKeyId: ACCESS_KEY_ID,
    accessKeySecret: jwt.sign(claims, salt)
  }
  fs.writeFileSync(PATH_TO_ACCESS, JSON.stringify(access, null, ' '))
  return access
}

export { createAccessFile as default }
