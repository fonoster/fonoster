import { join } from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { cli } from 'cli-ux'

const k8s = require('@kubernetes/client-node')
const btoa = require('btoa')
const kc = new k8s.KubeConfig()
kc.loadFromDefault()
const BASE_DIR = '/tmp/certs'

const k8sApi = kc.makeApiClient(k8s.CoreV1Api)

async function installConfig (context: string) {
  try {
    const config = btoa(fs.readFileSync('/tmp/certs/access'))
    const jwtSalt = btoa(fs.readFileSync('/tmp/certs/jwt.salt'))

    cli.log(`Removing old 'fonos-config' secret from context '${context}'`)
    try {
      await k8sApi.deleteNamespacedSecret('fonos-config', context)
    } catch (e) {}

    cli.log(`Installing new 'fonos-config' in context '${context}'`)
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
    console.log(e)
  }
}

async function installTLSCerts (context: string) {
  try {
    const key = btoa(fs.readFileSync('/tmp/certs/server.key'))
    const cert = btoa(fs.readFileSync('/tmp/certs/server.crt'))

    cli.log(`Removing old 'fonos-certs' secret from context '${context}'`)
    try {
      await k8sApi.deleteNamespacedSecret('fonos-certs', context)
    } catch (e) {}

    cli.log(`Installing new 'fonos-certs' in context '${context}'`)
    await k8sApi.createNamespacedSecret(context, {
      kind: 'Secret',
      metadata: { name: `fonos-certs` },
      type: 'kubernetes.io/tls',
      data: {
        'tls.key': key,
        'tls.crt': cert
      }
    })
  } catch (e) {
    console.log(e)
  }
}

async function installConfigLocal (subject: string) {
  cli.log('Installing configuration in local station')
  try {
    const targetDir = join(os.homedir(), '.fonos')
    const pathToConfig = join(os.homedir(), '.fonos', 'config')
    const config = JSON.parse(
      fs.readFileSync(join(BASE_DIR, 'access')).toString('utf-8')
    )
    config.endpoint = subject
    config.caCertificate = btoa(
      fs.readFileSync(join(BASE_DIR, 'ca.crt')).toString('utf-8')
    )
    config.clientCertificate = btoa(
      fs.readFileSync(join(BASE_DIR, 'client.crt')).toString('utf-8')
    )
    config.clientKey = btoa(
      fs.readFileSync(join(BASE_DIR, 'client.key')).toString('utf-8')
    )

    // TODO: Remove this test
    config.serverCertificate = btoa(
      fs.readFileSync(join(BASE_DIR, 'server.crt')).toString('utf-8')
    )
    config.serverKey = btoa(
      fs.readFileSync(join(BASE_DIR, 'server.key')).toString('utf-8')
    )

    const content = JSON.stringify(config, null, '')
    fs.mkdirSync(targetDir, { recursive: true })
    fs.writeFileSync(pathToConfig, content)
  } catch (e) {
    console.log(e)
  }
}

function cleanup () {
  cli.log('Removing temporary files')
  fs.rmdirSync(BASE_DIR, { recursive: true })
}

export { installConfig, installTLSCerts, installConfigLocal, cleanup }
