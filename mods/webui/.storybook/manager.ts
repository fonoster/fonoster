import type { ManagerConfig } from '@storybook/types';
import { addons } from '@storybook/manager-api';
import fonosterTheme from './theme';

addons.setConfig({
  sidebar: {
    showRoots: false
  },
  theme: fonosterTheme,
});
