import path from 'path'
import { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@theme': path.resolve(__dirname, 'theme'),
      '@components': path.resolve(__dirname, 'src/common/components'),
      '@layouts': path.resolve(__dirname, 'src/common/components/layout'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@stories': path.resolve(__dirname, 'stories'),
    }
    return config
  },
}

export default config
