import { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@mui/material', '@mui/lab', '@toolpad/core'],
  experimental: {
    turbo: {
      resolveAlias: {
        '@mui/material/utils': '@mui/system/utils'
      }
    }
  }
}

export default config
