import { addons } from '@storybook/manager-api';
import theme from './theme';

addons.setConfig({
  sidebar: {
    showRoots: false
  },
  theme
});
