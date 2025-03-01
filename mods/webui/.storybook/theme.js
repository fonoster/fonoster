import { create } from '@storybook/theming/create';

export default create({
  base: 'light',
  
  // Colores de la marca
  colorPrimary: '#39E19E',
  colorSecondary: '#C2C2C2',

  // UI
  appBg: '#F6F9FC',
  appContentBg: '#FFFFFF',
  appBorderColor: '#E0E0E0',
  appBorderRadius: 4,

  // Tipografía
  // fontBase: '"Poppins", sans-serif',
  // fontCode: '"Roboto Mono", monospace',

  // Colores del texto
  textColor: '#333333',
  textInverseColor: '#FFFFFF',

  // Barra de herramientas
  barTextColor: '#999999',
  barSelectedColor: '#39E19E',
  barBg: '#FFFFFF',

  // Formulario
  inputBg: '#FFFFFF',
  inputBorder: '#E0E0E0',
  inputTextColor: '#333333',
  inputBorderRadius: 4,

  // Marca
  brandTitle: 'Fonoster UI',
  brandUrl: 'https://fonoster.com',
  brandTarget: '_blank',
}); 