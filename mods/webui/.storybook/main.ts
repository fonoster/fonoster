import type { StorybookConfig } from '@storybook/nextjs'
import path, { dirname, join } from 'path';

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-onboarding"),
    getAbsolutePath("@storybook/addon-interactions"),
    '@chromatic-com/storybook'
  ],
  framework: {
    name: getAbsolutePath("@storybook/nextjs"),
    options: {}
  },
  docs: {},
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../src'),
        '@theme': path.resolve(__dirname, '../theme'),
        '@stories': path.resolve(__dirname, '../stories'),
        // Asegurarse de que Material UI pueda acceder al tema
        '@mui/material/styles': path.resolve(__dirname, '../node_modules/@mui/material/styles'),
        '@mui/material': path.resolve(__dirname, '../node_modules/@mui/material')
      }
    }

    // Imprimir la configuración para depuración
    console.log('Webpack aliases:', config.resolve?.alias);

    return config
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false,
      },
      propFilter: { skipPropsWithoutDoc: true },
    },
  },
  // Configuración adicional para asegurarse de que se carguen los módulos correctamente
  core: {
    builder: 'webpack5',
  },
  features: {
    storyStoreV7: true,
  },
  staticDirs: ['../public'],
}

export default config

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}