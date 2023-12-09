import { NextApiRequest } from 'next'
import { getSession } from 'next-auth/react'

export const getUserLogged = async (req: NextApiRequest) => {
  const session = await getSession({ req })

  if (!session?.user)
    throw new Error('You do not have permission to access this resource')

  return {
    accessKeyId: session.user.accessKeyId,
    accessKeySecret: session.user.accessKeySecret,
  }
}

export const getServerCurrentProject = (req: NextApiRequest) => ({
  accessKeyId: req.headers['x-project-id'] as string,
  accessKeySecret: req.headers['x-project-secret'] as string,
})
