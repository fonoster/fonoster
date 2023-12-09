import 'next-auth'

declare module 'next-auth' {
  interface User {
    accessKeyId: string
    accessKeySecret: string
  }

  interface Session {
    user: User
    endpoint: string
  }
}
