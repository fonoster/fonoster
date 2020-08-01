import { cli } from 'cli-ux'
const Docker = require('dockerode')

const getConfig = (subject?: string, name?: string) => {
  return {
    Volumes: {
      '/certs': {}
    },
    Hostconfig: {
      Binds: ['/tmp/certs:/certs']
    },
    Env: [`SUBJECT=${subject}`, `CERT_NAME=${name}`]
  }
}

export default async function (subject: string) {
  try {
    cli.log('Pulling docker images')

    const docker = new Docker()
    await docker.pull('fonoster/jwthelper')
    await docker.pull('fonoster/certshelper')

    cli.log('Creating jwt token')

    await docker.run('fonoster/jwthelper', [], null, getConfig())

    cli.log('Creating client certificates')

    await docker.run(
      'fonoster/certshelper',
      [],
      null,
      getConfig(subject, 'client')
    )

    cli.log('Creating server certificates ')

    await docker.run(
      'fonoster/certshelper',
      [],
      null,
      getConfig(subject, 'server')
    )
  } catch (e) {
    console.log(e)
  }
}
