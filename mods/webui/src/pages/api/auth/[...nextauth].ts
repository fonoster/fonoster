import logger from '@fonoster/logger'
import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import fetch from 'node-fetch'
import { config } from '../../../mods/shared/constants/config'

import {
  createToken,
  createUser,
  getUser,
  updateUser,
} from '@/mods/shared/helpers/api'

/**
 * @todo Refactor this file's logic
 */

async function getEmail(account) {
  // https://developer.github.com/v3/users/emails/#list-email-addresses-for-the-authenticated-user
  const res = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${account.access_token}`,
    },
  })

  const emails = (await res.json()) as any

  if (emails?.length === 0) return

  logger.verbose(`webui signIn [emails -> ${JSON.stringify(emails)}]`)

  // Sort by primary email - the user may have several emails, but only one of them will be primary
  const sortedEmails = Array.isArray(emails)
    ? emails?.sort((a, b) => b.primary - a.primary)
    : []

  return sortedEmails[0].email as string
}

const generateName = (email: string, name?: string) => {
  const [emailName] = email.split('@')

  return name || emailName
}

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: config.WEBUI_GITHUB_CLIENT_ID || '',
      clientSecret: config.WEBUI_GITHUB_CLIENT_SECRET || '',
    }),
  ],
  debug: true,
  secret: 'asdfasdfafasfasdfadfadfaf',
  jwt: {
    secret: 'asdfasdfafasfasdfadfadfaf',
  },
  callbacks: {
    async signIn({ profile, account }) {
      logger.verbose(`webui signIn [profile -> ${JSON.stringify(profile)}]`)
      logger.verbose(`webui signIn [account -> ${JSON.stringify(account)}]`)

      const email = await getEmail(account)

      let user = await getUser(email)

      if (!user) {
        if (!email) throw new Error('No email found')

        user = await createUser({
          email,
          avatar: profile?.image,
          name: generateName(email, profile?.name),
          // Setting this to a secured value but we won't
          // support username/password for now
          secret: account?.access_token,
        })
      }

      return true
    },
    async session({ session, token }) {
      logger.verbose(`webui session [session -> ${JSON.stringify(session)}]`)
      logger.verbose(`webui session [token -> ${JSON.stringify(token)}]`)
      logger.verbose(
        `webui session.endpoint [${config.WEBUI_APISERVER_ENDPOINT}]`
      )

      session.endpoint = config.WEBUI_APISERVER_ENDPOINT

      session.user = token.user as any

      return session
    },
    async jwt({ token, user, account }) {
      logger.verbose(`webui jwt [session -> ${JSON.stringify(token)}]`)
      logger.verbose(`webui jwt [token -> ${JSON.stringify(user)}]`)
      logger.verbose(`webui jwt [account -> ${JSON.stringify(account)}]`)

      account && (token.account = account)

      if (!(token.user as any)?.accessKeyId) {
        const email = await getEmail(token.account)

        const userFromFonoster = await getUser(email)

        const data = {
          ...user,
          accessKeyId: userFromFonoster?.accessKeyId,
          accessKeySecret: await createToken(userFromFonoster?.accessKeyId),
        }

        if (userFromFonoster && !userFromFonoster?.avatar && user?.image)
          await updateUser({ avatar: user.image, ref: userFromFonoster.ref })

        token.user = data
      }

      return token
    },
  },
})
