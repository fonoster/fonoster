/* eslint-disable sonarjs/no-duplicate-string */
import type { ScreenDetails } from '@/@types/ScreenDetails'

const generalDescription =
  'All features in Fonoster are designed to be API first. You can always interact with this service from your applications using one of our SDKs.'

const sipNetworkTitle = 'SIP Network'

const apps: ScreenDetails = {
  title: 'Applications',
  subtitle: 'Programmable Voice Applications.',
  description:
    'Use this section to connect your DialogFlow Agents with your Numbers.',
  docs: {
    url: '',
    title: 'Create an Application with the NodeSDK',
    description: generalDescription,
    tableContent: {
      headers: ['Param', 'Description'],
      rows: [
        ['name: string', 'The name of the application'],
        ['initialDtmf: string', 'Optional intitial DTMF'],
        ['activationIntentId: string', 'Activation intent ID'],
        ['interactionTimeout: number', 'Timeout, to ask again for user input'],
        ['transfer: TransferConfig', 'Transfer configuration object'],
        ['speechConfig: SpeechConfig', 'Speech configuration object'],
        [
          'intentsEngineConfig: IntentsEngineConfig',
          'Intents engine configuration object',
        ],
      ],
    },
    example: `
    const Fonoster = require("@fonoster/sdk")
    const apps = new Fonoster.Apps()

    const request = {
      name: "Clever Tube",
      initialDtmf: "12",
      speechConfig: {
        secretName: "clever-tube-secret",
        voice: "en-US-Wavenet-F"
      },
      intentsEngineConfig: {
        secretName: "clever-tube-secret",
        projectId: "clever-tube-275321"
      }
    }

    apps.createApp(request)
      .then(console.log)
      .catch(console.error)
    `,
  },
}

const trunks: ScreenDetails = {
  title: sipNetworkTitle,
  subtitle: 'Trunks',
  description:
    'Use this section to configure your VoIP Providers for inbound and outbound calls to the PSTN.',
  docs: {
    url: '',
    title: 'Creating a Trunk with the NodeSDK',
    description: generalDescription,
    tableContent: {
      headers: ['Param', 'Description'],
      rows: [
        ['name: string', 'The name of the trunk'],
        ['username: string', 'Username for the trunk'],
        ['secret: string', 'Password for the trunk'],
        ['host: string', 'Hostname or IP of the trunk'],
        ['transport: string', 'The transport for the trunk'],
        ['expires: number', 'Expiration time for the registration'],
      ],
    },
    example: `
    const Fonoster = require("@fonoster/sdk");
    const providers = new Fonoster.Providers();

    const request = {
      name: "SIP Trunk",
      username: "trunk001",
      secret: "secretkey",
      host: "sip.provider.net"
    };

    providers.createProvider(request)
      .then(console.log).catch(console.error);`,
  },
}

const numbers: ScreenDetails = {
  title: 'SIP Network',
  subtitle: 'Virtual Numbers',
  description:
    'You will need a Number to make and receive calls from the PSTN (traditional phones).',
  docs: {
    url: '',
    title: 'Creating a Number with the NodeSDK',
    description: generalDescription,
    tableContent: {
      headers: ['Param', 'Description'],
      rows: [
        ['providerRef: string', 'Provider identifier'],
        ['e164Number: string', 'A valid number @ Provider'],
        ['aorLink: string', 'An AOR where ingress calls will be directed to'],
        ['ingressInfo.webhook: string', 'Ingress webhook'],
        ['providerRef.appRef: string', 'Ingress application identifier'],
      ],
    },
    example: `
    const Fonoster = require("@fonoster/sdk");
    const numbers = new Fonoster.Numbers();

    const request = {
      providerRef: "516f1577bcf86cd797439012",
      e164Number: "+17853177343",
      ingressInfo: {
        webhook: "https://webhooks.acme.com/hooks"
      }
    };

    numbers.createNumber(request)
      .then(console.log).catch(console.error);`,
  },
}

const domains: ScreenDetails = {
  title: sipNetworkTitle,
  subtitle: 'Domains for internal communications.',
  description:
    'A SIP Domain will group several SIP Agents. (e.g office, home, etc)',
  docs: {
    url: '',
    title: 'Creating a Domain with the NodeSDK',
    description:
      'All features in Fonoster are designed to be API first. You can always interact with this service from your applications using one of our SDKs.',
    tableContent: {
      headers: ['Param', 'Description'],
      rows: [
        ['name: string', 'The name of the domain'],
        ['domainUri: string', 'The domain URI'],
        ['egressNumberRef: string', 'Reference to outbound Number'],
        ['egressRule: string', 'Regular expression for outbound routing'],
        [
          'accessDeny: string[]',
          'List of IPs or networks that cannot access this domain',
        ],
        [
          'accessAllow: string[]',
          'List of IPs or networks that can access this domain',
        ],
      ],
    },
    example: `
    const Fonoster = require("@fonoster/sdk");
    const domains = new Fonoster.Domains();

    domains.createDomain({ name: "Local Domain", domainUri: "sip.local" })
      .then(console.log).catch(console.error);`,
  },
}

const agents: ScreenDetails = {
  title: sipNetworkTitle,
  subtitle: 'Agent for your internal communications.',
  description:
    'SIP Agents in the same Domain can call each other with Voice Over IP using a Software Phone (e.g Zoiper)',
  docs: {
    url: '',
    title: 'Creating an Agent with the NodeSDK',
    description: generalDescription,
    tableContent: {
      headers: ['Param', 'Description'],
      rows: [
        ['name: string', 'The name of the Agent'],
        ['username: string', 'The username for SIP access'],
        ['secret: string', 'The password for SIP access'],
        ['privacy: string', 'Privacy mode (default: "none")'],
        ['domains: string[]', 'List of Domains for this Agent'],
      ],
    },
    example: `
    const Fonoster = require("@fonoster/sdk")
    const agents = new Fonoster.Agents()

    const request = {
      name: "John Doe",
      username: "john",
      secret: "1234",
      domains: ["sip.local"]
    }

    agents.createAgent(request)
      .then(console.log).catch(console.error)`,
  },
}

const secrets: ScreenDetails = {
  title: 'Secrets Management',
  subtitle: 'Safeguard your credentials in the Secrets Vault.',
  description:
    'Secrets are encrypted variables that you can you use in your Voice Applications and APIs. Your secrets are only available for use within the Project.',
  docs: {
    url: '',
    title: 'Creating a Secret with the NodeSDK',
    description: generalDescription,
    tableContent: {
      headers: ['Param', 'Description'],
      rows: [
        ['name: string', 'Friendly name'],
        ['type: enum', 'Type of value'],
        ['value: string', 'Value of secret'],
      ],
    },
    example: `
    const Fonoster = require("@fonoster/sdk")
    const secrets = new Fonoster.Secrets()

    const request = {
      secretName: "my-secret",
      secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    };

    secrets.createSecret(request)
      .then(console.log).catch(console.error);`,
  },
}

export { agents, apps, domains, numbers, secrets, trunks }
