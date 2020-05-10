
type Agent = {
    metadata: {
        ref: string
        name: string
        createdOn?: string
        modifiedOn?: string
    }
    spec: {
        credentials: {
            username: string
            secret: string
        }
        domains: string[]
    }
}

export type { Agent }
