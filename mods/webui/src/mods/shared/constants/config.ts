import getConfig from 'next/config'

type Config = {
  publicRuntimeConfig: {
    [key: string]: string
    APP_FEATURE_FLAG_SEND_REGISTER: string
    WEBUI_APISERVER_ENDPOINT: string
    WEBUI_APP_URL: string
    WEBUI_BILLING_URL: string
    WEBUI_BANNER_ANNOUNCEMENT: string
    WEBUI_FEEDBACK_URL: string
    WEBUI_TEST_PHONE_DOMAIN: string
    WEBUI_TEST_PHONE_SERVER: string
    WEBUI_TEST_PHONE_USERNAME: string
    WEBUI_TEST_PHONE_SECRET: string
    WEBUI_TEST_PHONE_DISPLAY_NAME: string
    WEBUI_GITHUB_CLIENT_ID: string
    WEBUI_GITHUB_CLIENT_SECRET: string
  }
}

const { publicRuntimeConfig } = getConfig() as Config

export const config = Object.freeze({
  ...publicRuntimeConfig,
  APP_FEATURE_FLAG_SEND_REGISTER:
    publicRuntimeConfig.APP_FEATURE_FLAG_SEND_REGISTER === 'true',
})

export const __WEBUI_TEST_PHONE_CONFIG__ = Object.freeze({
  displayName: config.WEBUI_TEST_PHONE_DISPLAY_NAME,
  domain: config.WEBUI_TEST_PHONE_DOMAIN,
  username: config.WEBUI_TEST_PHONE_USERNAME,
  secret: config.WEBUI_TEST_PHONE_SECRET,
  audioElementId: 'remoteAudio',
  server: config.WEBUI_TEST_PHONE_SERVER,
})
