import mix from 'mixpanel-browser'

import { config } from '@/mods/shared/constants/config'

export interface TelemetryConfig {
  enabled: boolean
  token: string
}

const mixpanel = (config: TelemetryConfig) => {
  if (config.enabled && config.token) {
    mix.init(config.token, { debug: process.env.NODE_ENV === 'development' })
  }

  return {
    track: (
      event: string,
      properties?: Record<string, any>,
      accessKeyId?: string
    ) => {
      if (config.enabled && config.token) {
        if (accessKeyId) mix.identify(accessKeyId)

        mix.track(event, properties)
      }
    },
  }
}

export const analytics = mixpanel({
  enabled: config.APP_TELEMETRY_ENABLED,
  token: config.APP_TELEMETRY_MIXPANEL_TOKEN,
})
