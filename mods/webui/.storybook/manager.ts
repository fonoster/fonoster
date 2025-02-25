import type { ManagerConfig } from '@storybook/types';
import { fnLight, fnDark } from '../theme/theme';

export const config: ManagerConfig = {
  sidebar: {
    showRoots: false
  },
  theme: {
    ...fnLight,
    ...fnDark
  }
};
