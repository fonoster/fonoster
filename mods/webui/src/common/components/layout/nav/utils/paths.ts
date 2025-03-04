export const paths = {
  home: "/",
  workspaces: {
    overview: (workspaceId: string) => `/workspace/${workspaceId}/overview`,
    list: "/workspaces",
    applications: (workspaceId: string) =>
      `/workspace/${workspaceId}/applications`,
    sipNetwork: {
      list: (workspaceId: string) => `/workspace/${workspaceId}/sip-network/`,
      trunks: (workspaceId: string) =>
        `/workspace/${workspaceId}/sip-network/trunks`,
      numbers: (workspaceId: string) =>
        `/workspace/${workspaceId}/sip-network/numbers`,
      domains: (workspaceId: string) =>
        `/workspace/${workspaceId}/sip-network/domains`,
      agents: (workspaceId: string) =>
        `/workspace/${workspaceId}/sip-network/agents`,
      acls: (workspaceId: string) =>
        `/workspace/${workspaceId}/sip-network/acls`,
      credentials: (workspaceId: string) =>
        `/workspace/${workspaceId}/sip-network/credentials`
    },
    storage: (workspaceId: string) => `/workspace/${workspaceId}/storage`,
    secrets: (workspaceId: string) => `/workspace/${workspaceId}/secrets`,
    apiKey: (workspaceId: string) => `/workspace/${workspaceId}/api-keys`,
    monitoring: (workspaceId: string) => `/workspace/${workspaceId}/monitoring`
  }
} as const;
