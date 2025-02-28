const path = require('path');

module.exports = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
    '@chromatic-com/storybook'
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {}
  },
  docs: {},
  webpackFinal: async (config) => {
    // Asegurarse de que los alias estén configurados correctamente
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src'),
      '@theme': path.resolve(__dirname, '../theme'),
      '@stories': path.resolve(__dirname, '../stories')
    };

    // Añadir reglas para procesar correctamente los archivos CSS
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
      include: path.resolve(__dirname, '../'),
    });

    // Asegurarse de que Material UI se configure correctamente
    config.resolve.extensions = [...config.resolve.extensions, '.ts', '.tsx'];

    // Imprimir la configuración para depuración
    console.log('Webpack config aliases:', config.resolve.alias);

    return config;
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
  }
}; 