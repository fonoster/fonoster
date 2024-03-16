/** @type {import('next').NextConfig} */
const { join } = require('path')
const dotenv = require('dotenv')

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: join('../../', '.env') })
}

module.exports = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    WEBUI_APP_URL: process.env.WEBUI_APP_URL,
    WEBUI_APISERVER_ENDPOINT: process.env.WEBUI_APISERVER_ENDPOINT,
    WEBUI_GITHUB_CLIENT_ID: process.env.WEBUI_GITHUB_CLIENT_ID,
    WEBUI_GITHUB_CLIENT_SECRET: process.env.WEBUI_GITHUB_CLIENT_SECRET,
    WEBUI_BILLING_URL: process.env.WEBUI_BILLING_URL,
    WEBUI_BANNER_ANNOUNCEMENT: process.env.WEBUI_BANNER_ANNOUNCEMENT,
    WEBUI_FEEDBACK_URL: process.env.WEBUI_FEEDBACK_URL,
    WEBUI_TEST_PHONE_DISPLAY_NAME: process.env.WEBUI_TEST_PHONE_DISPLAY_NAME,
    WEBUI_TEST_PHONE_DOMAIN: process.env.WEBUI_TEST_PHONE_DOMAIN,
    WEBUI_TEST_PHONE_SERVER: process.env.WEBUI_TEST_PHONE_SERVER,
    WEBUI_TEST_PHONE_USERNAME: process.env.WEBUI_TEST_PHONE_USERNAME,
    WEBUI_TEST_PHONE_SECRET: process.env.WEBUI_TEST_PHONE_SECRET,
    APP_FEATURE_FLAG_SEND_REGISTER: process.env.APP_FEATURE_FLAG_SEND_REGISTER,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
}
