import fs from 'fs'
import jwt from 'jsonwebtoken'
import { forge } from 'acme-client'
import { join } from 'path'
import { homedir } from 'os'

const btoa = require('btoa')

const BASE_DIR = join(homedir(), '.fonos')
const PATH_TO_SALT = join(BASE_DIR, 'jwt.salt')
const PATH_TO_CONFIG = join(BASE_DIR, 'config')
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID || 'fonos'
const ISS = process.env.ISS || 'fonos'

const getContent = (file: string) =>
  btoa(fs.readFileSync(`${BASE_DIR}/${file}`).toString('utf-8'))

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

async function createConfig (subject: string, workdir: string) {
  try {
    const pathToConfig = join(workdir, 'config')
    const config = JSON.parse(fs.readFileSync(pathToConfig).toString('utf-8'))

    config.endpoint = subject
    config.caCertificate = getContent('ca.crt')
    config.clientCertificate = getContent('client.crt')
    config.clientKey = getContent('client.key')

    const content = JSON.stringify(config, null, '')
    fs.mkdirSync(workdir, { recursive: true })
    fs.writeFileSync(pathToConfig, content)
  } catch (e) {
    console.error(e)
  }
}

export {
  createAccessFile as default,
  createConfig,
  getSalt,
  configExist,
  saltExist,
  PATH_TO_SALT,
  PATH_TO_CONFIG,
  ACCESS_KEY_ID,
  ISS
}
