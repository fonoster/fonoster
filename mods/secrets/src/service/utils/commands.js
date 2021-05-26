const sealStatusResponse = {
    type: 'object',
    properties: {
      sealed: {
        type: 'boolean',
      },
      t: {
        type: 'integer',
      },
      n: {
        type: 'integer',
      },
      progress: {
        type: 'integer',
      },
    },
    required: ['sealed', 't', 'n', 'progress'],
  };
  
  const auth = {
    type: 'object',
    properties: {
      client_token: {
        type: 'string',
      },
      policies: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      metadata: {
        type: 'object',
      },
      lease_duration: {
        type: 'integer',
      },
      renewable: {
        type: 'boolean',
      },
    },
  };
  
  const tokenResponse = {
    type: 'object',
    properties: {
      auth,
    },
    required: ['auth'],
  };
  
  const approleResponse = {
    type: 'object',
    properties: {
      auth,
      warnings: {
        type: 'string',
      },
      wrap_info: {
        type: 'string',
      },
      data: {
        type: 'object',
      },
      lease_duration: {
        type: 'integer',
      },
      renewable: {
        type: 'boolean',
      },
      lease_id: {
        type: 'string',
      },
    },
  };
  
  module.exports = {
    status: {
      method: 'GET',
      path: '/sys/seal-status',
      schema: {
        res: sealStatusResponse,
      },
    },
    initialized: {
      method: 'GET',
      path: '/sys/init',
    },
    init: {
      method: 'PUT',
      path: '/sys/init',
      schema: {
        req: {
          type: 'object',
          properties: {
            secret_shares: {
              type: 'integer',
              minimum: 1,
            },
            secret_threshold: {
              type: 'integer',
              minimum: 1,
            },
            pgp_keys: {
              type: 'array',
              items: {
                type: 'string',
              },
              uniqueItems: true,
            },
          },
          required: ['secret_shares', 'secret_threshold'],
        },
        res: {
          type: 'object',
          properties: {
            keys: {
              type: 'array',
              items: {
                type: 'string',
              },
              uniqueItems: true,
            },
            root_token: {
              type: 'string',
            },
          },
          required: ['keys', 'root_token'],
        },
      },
    },
    unseal: {
      method: 'PUT',
      path: '/sys/unseal',
      schema: {
        req: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
            },
            reset: {
              type: 'boolean',
            },
            migrate: {
              type: 'boolean',
            },
          },
        },
        res: sealStatusResponse,
      },
    },
    seal: {
      method: 'PUT',
      path: '/sys/seal',
    },
    generateRootStatus: {
      method: 'GET',
      path: '/sys/generate-root/attempt',
      schema: {
        res: {
          type: 'object',
          properties: {
            started: {
              type: 'boolean',
            },
            nonce: {
              type: 'string',
            },
            progress: {
              type: 'integer',
              minimum: 0,
            },
            required: {
              type: 'integer',
              minimum: 1,
            },
            pgp_fingerprint: {
              type: 'string',
            },
            complete: {
              type: 'boolean',
            },
          },
          required: ['started', 'nonce', 'progress', 'required', 'pgp_fingerprint', 'complete'],
        },
      },
    },
    generateRootInit: {
      method: 'PUT',
      path: '/sys/generate-root/attempt',
      schema: {
        req: {
          type: 'object',
          properties: {
            otp: {
              type: 'string',
            },
            pgp_key: {
              type: 'string',
            },
          },
        },
        res: {
          type: 'object',
          properties: {
            started: {
              type: 'boolean',
            },
            nonce: {
              type: 'string',
            },
            progress: {
              type: 'integer',
              minimum: 0,
            },
            required: {
              type: 'integer',
              minimum: 1,
            },
            pgp_fingerprint: {
              type: 'string',
            },
            complete: {
              type: 'boolean',
            },
          },
          required: ['started', 'nonce', 'progress', 'required', 'pgp_fingerprint', 'complete'],
        },
      },
    },
    generateRootCancel: {
      method: 'DELETE',
      path: '/sys/generate-root/attempt',
    },
    generateRootUpdate: {
      method: 'PUT',
      path: '/sys/generate-root/update',
      schema: {
        req: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
            },
            nonce: {
              type: 'string',
            },
          },
          required: ['key', 'nonce'],
        },
        res: {
          type: 'object',
          properties: {
            started: {
              type: 'boolean',
            },
            nonce: {
              type: 'string',
            },
            progress: {
              type: 'integer',
              minimum: 0,
            },
            required: {
              type: 'integer',
              minimum: 1,
            },
            pgp_fingerprint: {
              type: 'string',
            },
            complete: {
              type: 'boolean',
            },
            encoded_root_token: {
              type: 'string',
            },
          },
          required: ['started', 'nonce', 'progress', 'required', 'pgp_fingerprint', 'complete'],
        },
      },
    },
    mounts: {
      method: 'GET',
      path: '/sys/mounts',
    },
    mount: {
      method: 'POST',
      path: '/sys/mounts/{{mount_point}}',
    },
    encryptData: {
      method: 'POST',
      path: '/transit/encrypt/{{name}}',
    },
    decryptData: {
      method: 'POST',
      path: '/transit/decrypt/{{name}}',
    },
    generateDatabaseCredentials: {
      method: 'GET',
      path: '/{{databasePath}}/creds/{{name}}',
    },
    unmount: {
      method: 'DELETE',
      path: '/sys/mounts/{{mount_point}}',
    },
    remount: {
      method: 'POST',
      path: '/sys/remount',
    },
    policies: {
      method: 'GET',
      path: '/sys/policy',
    },
    addPolicy: {
      method: 'PUT',
      path: '/sys/policy/{{name}}',
    },
    getPolicy: {
      method: 'GET',
      path: '/sys/policy/{{name}}',
    },
    removePolicy: {
      method: 'DELETE',
      path: '/sys/policy/{{name}}',
    },
    auths: {
      method: 'GET',
      path: '/sys/auth',
    },
    enableAuth: {
      method: 'POST',
      path: '/sys/auth/{{mount_point}}',
    },
    disableAuth: {
      method: 'DELETE',
      path: '/sys/auth/{{mount_point}}',
    },
    audits: {
      method: 'GET',
      path: '/sys/audit',
    },
    enableAudit: {
      method: 'PUT',
      path: '/sys/audit/{{name}}',
    },
    disableAudit: {
      method: 'DELETE',
      path: '/sys/audit/{{name}}',
    },
    renew: {
      method: 'PUT',
      path: '/sys/leases/renew',
      schema: {
        req: {
          type: 'object',
          properties: {
            lease_id: {
              type: 'string',
            },
            increment: {
              type: 'integer',
            },
          },
          required: ['lease_id'],
        },
        res: {
          type: 'object',
          properties: {
            lease_id: {
              type: 'string',
            },
            renewable: {
              type: 'boolean',
            },
            lease_duration: {
              type: 'integer',
            },
          },
        },
      },
    },
    revoke: {
      method: 'PUT',
      path: '/sys/leases/revoke',
      schema: {
        req: {
          type: 'object',
          properties: {
            lease_id: {
              type: 'string',
            },
          },
          required: ['lease_id'],
        },
      },
    },
    revokePrefix: {
      method: 'PUT',
      path: '/sys/revoke-prefix/{{path_prefix}}',
    },
    rotate: {
      method: 'PUT',
      path: '/sys/rotate',
    },
    unwrap: {
      method: 'POST',
      path: '/sys/wrapping/unwrap',
      schema: {
        req: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
            },
          },
        },
      },
    },
    gcpLogin: {
      method: 'POST',
      path: '/auth/{{mount_point}}{{^mount_point}}gcp{{/mount_point}}/login',
      tokenSource: true,
      schema: {
        req: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
            },
            jwt: {
              type: 'string',
            },
          },
          required: ['role', 'jwt'],
        },
        res: tokenResponse,
      },
    },
    githubLogin: {
      method: 'POST',
      path: '/auth/{{mount_point}}{{^mount_point}}github{{/mount_point}}/login',
      tokenSource: true,
      schema: {
        req: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
            },
          },
          required: ['token'],
        },
        res: tokenResponse,
      },
    },
    kubernetesLogin: {
      method: 'POST',
      path: '/auth/{{mount_point}}{{^mount_point}}kubernetes{{/mount_point}}/login',
      tokenSource: true,
      schema: {
        req: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
            },
            jwt: {
              type: 'string',
            },
          },
          required: ['role', 'jwt'],
        },
        res: tokenResponse,
      },
    },
    awsIamLogin: {
      method: 'POST',
      path: '/auth/{{mount_point}}{{^mount_point}}aws{{/mount_point}}/login',
      tokenSource: true,
      schema: {
        req: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
            },
            iam_http_request_method: {
              type: 'string',
            },
            iam_request_url: {
              type: 'string',
            },
            iam_request_body: {
              type: 'string',
            },
            iam_request_headers: {
              type: 'string',
            },
          },
          required: [
            'role',
            'iam_http_request_method',
            'iam_request_url',
            'iam_request_body',
            'iam_request_headers',
          ],
        },
        res: tokenResponse,
      },
    },
    userpassLogin: {
      method: 'POST',
      path: '/auth/{{mount_point}}{{^mount_point}}userpass{{/mount_point}}/login/{{username}}',
      tokenSource: true,
      schema: {
        req: {
          type: 'object',
          properties: {
            password: {
              type: 'string',
            },
          },
          required: ['password'],
        },
        res: tokenResponse,
      },
    },
    ldapLogin: {
      method: 'POST',
      path: '/auth/{{mount_point}}{{^mount_point}}ldap{{/mount_point}}/login/{{username}}',
      tokenSource: true,
      schema: {
        req: {
          type: 'object',
          properties: {
            password: {
              type: 'string',
            },
          },
          required: ['password'],
        },
        res: tokenResponse,
      },
    },
    oktaLogin: {
      method: 'POST',
      path: '/auth/{{mount_point}}{{^mount_point}}okta{{/mount_point}}/login/{{username}}',
      tokenSource: true,
      schema: {
        req: {
          type: 'object',
          properties: {
            password: {
              type: 'string',
            },
          },
          required: ['password'],
        },
        res: tokenResponse,
      },
    },
    radiusLogin: {
      method: 'POST',
      path: '/auth/{{mount_point}}{{^mount_point}}radius{{/mount_point}}/login/{{username}}',
      tokenSource: true,
      schema: {
        req: {
          type: 'object',
          properties: {
            password: {
              type: 'string',
            },
          },
          required: ['password'],
        },
        res: tokenResponse,
      },
    },
    tokenAccessors: {
      method: 'LIST',
      path: '/auth/token/accessors',
      schema: {
        res: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                keys: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
          required: ['data'],
        },
      },
    },
    tokenCreate: {
      method: 'POST',
      path: '/auth/token/create',
      tokenSource: true,
      schema: {
        req: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            policies: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            meta: {
              type: 'object',
            },
            no_parent: {
              type: 'boolean',
            },
            no_default_policy: {
              type: 'boolean',
            },
            renewable: {
              type: 'boolean',
            },
            ttl: {
              type: 'string',
            },
            explicit_max_ttl: {
              type: 'string',
            },
            display_name: {
              type: 'string',
            },
            num_uses: {
              type: 'integer',
            },
          },
        },
        res: tokenResponse,
      },
    },
    tokenCreateOrphan: {
      method: 'POST',
      path: '/auth/token/create-orphan',
      tokenSource: true,
      schema: {
        req: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            policies: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            meta: {
              type: 'object',
            },
            no_parent: {
              type: 'boolean',
            },
            no_default_policy: {
              type: 'boolean',
            },
            renewable: {
              type: 'boolean',
            },
            ttl: {
              type: 'string',
            },
            explicit_max_ttl: {
              type: 'string',
            },
            display_name: {
              type: 'string',
            },
            num_uses: {
              type: 'integer',
            },
          },
        },
        res: tokenResponse,
      },
    },
    tokenCreateRole: {
      method: 'POST',
      path: '/auth/token/create/{{role_name}}',
      tokenSource: true,
      schema: {
        req: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            policies: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            meta: {
              type: 'object',
            },
            no_parent: {
              type: 'boolean',
            },
            no_default_policy: {
              type: 'boolean',
            },
            renewable: {
              type: 'boolean',
            },
            ttl: {
              type: 'string',
            },
            explicit_max_ttl: {
              type: 'string',
            },
            display_name: {
              type: 'string',
            },
            num_uses: {
              type: 'integer',
            },
          },
        },
        res: tokenResponse,
      },
    },
    tokenLookup: {
      method: 'POST',
      path: '/auth/token/lookup',
      schema: {
        req: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
            },
          },
          required: ['token'],
        },
        res: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                policies: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                path: {
                  type: 'string',
                },
                meta: {
                  type: 'object',
                },
                display_name: {
                  type: 'string',
                },
                num_uses: {
                  type: 'integer',
                },
              },
            },
          },
          required: ['data'],
        },
      },
    },
    tokenLookupAccessor: {
      method: 'POST',
      path: '/auth/token/lookup-accessor',
      schema: {
        req: {
          type: 'object',
          properties: {
            accessor: {
              type: 'string',
            },
          },
          required: ['accessor'],
        },
        res: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                policies: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                path: {
                  type: 'string',
                },
                meta: {
                  type: 'object',
                },
                display_name: {
                  type: 'string',
                },
                num_uses: {
                  type: 'integer',
                },
              },
            },
          },
          required: ['data'],
        },
      },
    },
    tokenLookupSelf: {
      method: 'GET',
      path: '/auth/token/lookup-self',
      schema: {
        res: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                policies: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                path: {
                  type: 'string',
                },
                meta: {
                  type: 'object',
                },
                display_name: {
                  type: 'string',
                },
                num_uses: {
                  type: 'integer',
                },
              },
            },
          },
          required: ['data'],
        },
      },
    },
    tokenRenew: {
      method: 'POST',
      path: '/auth/token/renew',
      tokenSource: true,
      schema: {
        req: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
            },
            increment: {
              type: ['integer', 'string'],
            },
          },
          required: ['token'],
        },
        res: tokenResponse,
      },
    },
    tokenRenewSelf: {
      method: 'POST',
      path: '/auth/token/renew-self',
      tokenSource: true,
      schema: {
        req: {
          type: 'object',
          properties: {
            increment: {
              type: ['integer', 'string'],
            },
          },
        },
        res: tokenResponse,
      },
    },
    tokenRevoke: {
      method: 'POST',
      path: '/auth/token/revoke',
      schema: {
        req: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
            },
          },
          required: ['token'],
        },
      },
    },
    tokenRevokeAccessor: {
      method: 'POST',
      path: '/auth/token/revoke-accessor',
      schema: {
        req: {
          type: 'object',
          properties: {
            accessor: {
              type: 'string',
            },
          },
          required: ['accessor'],
        },
      },
    },
    tokenRevokeOrphan: {
      method: 'POST',
      path: '/auth/token/revoke-orphan',
      schema: {
        req: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
            },
          },
          required: ['token'],
        },
      },
    },
    tokenRevokeSelf: {
      method: 'POST',
      path: '/auth/token/revoke-self',
    },
    tokenRoles: {
      method: 'GET',
      path: '/auth/token/roles?list=true',
      schema: {
        res: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                keys: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
          required: ['data'],
        },
      },
    },
    addTokenRole: {
      method: 'POST',
      path: '/auth/token/roles/{{role_name}}',
      schema: {
        req: {
          type: 'object',
          properties: {
            allowed_policies: {
              type: 'string',
            },
            disallowed_policies: {
              type: 'string',
            },
            orphan: {
              type: 'boolean',
            },
            period: {
              type: 'integer',
            },
            renewable: {
              type: 'boolean',
            },
            path_suffix: {
              type: 'string',
            },
            explicit_max_ttl: {
              type: 'integer',
            },
          },
        },
      },
    },
    getTokenRole: {
      method: 'GET',
      path: '/auth/token/roles/{{role_name}}',
    },
    removeTokenRole: {
      method: 'DELETE',
      path: '/auth/token/roles/{{role_name}}',
    },
    approleRoles: {
      method: 'LIST',
      path: '/auth/{{mount_point}}{{^mount_point}}approle{{/mount_point}}/role',
      schema: {
        res: approleResponse,
      },
    },
    addApproleRole: {
      method: 'POST',
      path: '/auth/{{mount_point}}{{^mount_point}}approle{{/mount_point}}/role/{{role_name}}',
      schema: {
        req: {
          type: 'object',
          properties: {
            bind_secret_id: {
              type: 'boolean',
            },
            bound_cidr_list: {
              type: 'string',
            },
            policies: {
              type: 'string',
            },
            secret_id_num_uses: {
              type: 'integer',
            },
            secret_id_ttl: {
              type: 'integer',
            },
            token_num_uses: {
              type: 'integer',
            },
            token_ttl: {
              type: 'integer',
            },
            token_max_ttl: {
              type: 'integer',
            },
            period: {
              type: 'integer',
            },
          },
        },
      },
    },
    getApproleRole: {
      method: 'GET',
      path: '/auth/{{mount_point}}{{^mount_point}}approle{{/mount_point}}/role/{{role_name}}',
      schema: {
        res: approleResponse,
      },
    },
    deleteApproleRole: {
      method: 'DELETE',
      path: '/auth/{{mount_point}}{{^mount_point}}approle{{/mount_point}}/role/{{role_name}}',
    },
    getApproleRoleId: {
      method: 'GET',
      path: '/auth/{{mount_point}}{{^mount_point}}approle{{/mount_point}}/role/{{role_name}}/role-id',
      schema: {
        res: approleResponse,
      },
    },
    updateApproleRoleId: {
      method: 'POST',
      path: '/auth/{{mount_point}}{{^mount_point}}approle{{/mount_point}}/role/{{role_name}}/role-id',
      schema: {
        req: {
          type: 'object',
          properties: {
            role_id: {
              type: 'string',
            },
          },
          required: ['role_id'],
        },
      },
    },
    getApproleRoleSecret: {
      method: 'POST',
      path: '/auth/{{mount_point}}{{^mount_point}}approle{{/mount_point}}' +
        '/role/{{role_name}}/secret-id',
      schema: {
        req: {
          type: 'object',
          properties: {
            metadata: {
              type: 'string',
            },
            cidr_list: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
        res: approleResponse,
      },
    },
    approleSecretAccessors: {
      method: 'LIST',
      path: '/auth/{{mount_point}}{{^mount_point}}approle{{/mount_point}}' +
        '/role/{{role_name}}/secret-id',
      schema: {
        res: approleResponse,
      },
    },
    approleSecretLookup: {
      method: 'POST',
      path: '/auth/{{mount_point}}{{^mount_point}}approle{{/mount_point}}' +
        '/role/{{role_name}}/secret-id/lookup',
      schema: {
        req: {
          type: 'object',
          properties: {
            secret_id: {
              type: 'string',
            },
          },
          required: ['secret_id'],
        },
        res: approleResponse,
      },
    },
    approleSecretDestroy: {
      method: 'POST',
      path: '/auth/{{mount_point}}{{^mount_point}}approle{{/mount_point}}' +
        '/role/{{role_name}}/secret-id/destroy',
      schema: {
        req: {
          type: 'object',
          properties: {
            secret_id: {
              type: 'string',
            },
          },
          required: ['secret_id'],
        },
      },
    },
    approleSecretAccessorLookup: {
      method: 'POST',
      path: '/auth/{{mount_point}}{{^mount_point}}approle{{/mount_point}}' +
        '/role/{{role_name}}/secret-id-accessor/lookup',
      schema: {
        req: {
          type: 'object',
          properties: {
            secret_id_accessor: {
              type: 'string',
            },
          },
          required: ['secret_id_accessor'],
        },
      },
    },
    approleSecretAccessorDestroy: {
      method: 'POST',
      path: '/auth/{{mount_point}}{{^mount_point}}approle{{/mount_point}}' +
        '/role/{{role_name}}/secret-id-accessor/destroy',
    },
    approleLogin: {
      method: 'POST',
      path: '/auth/{{mount_point}}{{^mount_point}}approle{{/mount_point}}/login',
      tokenSource: true,
      schema: {
        req: {
          type: 'object',
          properties: {
            role_id: {
              type: 'string',
            },
            secret_id: {
              type: 'string',
            },
          },
          required: ['role_id'],
        },
        res: approleResponse,
      },
    },
    health: {
      method: 'GET',
      path: '/sys/health',
      schema: {
        query: {
          type: 'object',
          properties: {
            standbyok: {
              type: 'boolean',
            },
            activecode: {
              type: 'integer',
            },
            standbycode: {
              type: 'integer',
            },
            sealedcode: {
              type: 'integer',
            },
            uninitcode: {
              type: 'integer',
            },
          },
        },
        res: {
          type: 'object',
          properties: {
            cluster_id: {
              type: 'string',
            },
            cluster_name: {
              type: 'string',
            },
            version: {
              type: 'string',
            },
            server_time_utc: {
              type: 'integer',
            },
            standby: {
              type: 'boolean',
            },
            sealed: {
              type: 'boolean',
            },
            initialized: {
              type: 'boolean',
            },
          },
        },
      },
    },
    leader: {
      method: 'GET',
      path: '/sys/leader',
      schema: {
        res: {
          type: 'object',
          properties: {
            ha_enabled: {
              type: 'boolean',
            },
            is_self: {
              type: 'boolean',
            },
            leader_address: {
              type: 'string',
            },
          },
        },
      },
    },
    stepDown: {
      method: 'PUT',
      path: '/sys/step-down',
    },
  };