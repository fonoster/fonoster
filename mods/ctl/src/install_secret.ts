import { join } from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { cli } from 'cli-ux'
import { CLIError } from '@oclif/errors'

const k8s = require('@kubernetes/client-node')
const btoa = require('btoa')
const BASE_DIR = '/tmp/certs'
const getContent = (file: string) =>
  btoa(fs.readFileSync(`${BASE_DIR}/${file}`).toString('utf-8'))

function getK8sApi () {
  const kc = new k8s.KubeConfig()
  kc.loadFromDefault()
  return kc.makeApiClient(k8s.CoreV1Api)
}

async function installConfig (context: string) {
  try {
    const k8sApi = getK8sApi()
    const config = getContent('config')
    const jwtSalt = getContent('jwt.salt')

    cli.log(`Removing old configuration`)
    try {
      await k8sApi.deleteNamespacedSecret('fonos-config', context)
    } catch (e) {}

    cli.log(`Installing new configuration`)
    await k8sApi.createNamespacedSecret(context, {
      kind: 'Secret',
      metadata: { name: `fonos-config` },
      type: 'Opaque',
      data: {
        config,
        'jwt.salt': jwtSalt
      }
    })
  } catch (e) {
    throw new CLIError(e.response.body.message)
  }
}

async function installTLSCerts (context: string) {
  try {
    const k8sApi = getK8sApi()
    const key = getContent('server.key')
    const cert = getContent('server.crt')

    cli.log(`Removing old certificates`)
    try {
      await k8sApi.deleteNamespacedSecret('fonos-certs', context)
    } catch (e) {}

    cli.log(`Installing new certificates`)
    await k8sApi
      .createNamespacedSecret(context, {
        kind: 'Secret',
        metadata: { name: `fonos-certs` },
        type: 'kubernetes.io/tls',
        data: {
          'tls.key': key,
          'tls.crt': cert
        }
      })
      .catch((e: any) => console.log(e.message))
  } catch (e) {
    throw new CLIError(e.response.body.message)
  }
}

async function installConfigLocal (subject: string) {
  cli.log('Installing configuration in local station')
  try {
    const targetDir = join(os.homedir(), '.fonos')
    const pathToConfig = join(os.homedir(), '.fonos', 'config')
    const config = JSON.parse(
      fs.readFileSync(join(BASE_DIR, 'config')).toString('utf-8')
    )
    config.endpoint = subject
    config.caCertificate = getContent('ca.crt')
    config.clientCertificate = getContent('client.crt')
    config.clientKey = getContent('client.key')

    const content = JSON.stringify(config, null, '')
    fs.mkdirSync(targetDir, { recursive: true })
    fs.writeFileSync(pathToConfig, content)
  } catch (e) {
    throw new CLIError(e.message)
  }
}

function cleanup () {
  cli.log('Removing temporary files')
  fs.rmdirSync(BASE_DIR, { recursive: true })
}

export { installConfig, installTLSCerts, installConfigLocal, cleanup }
