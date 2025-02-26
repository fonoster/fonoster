import * as React from 'react';

import { VerticalLayout } from './vertical/vertical-layout';

export interface SecuredLayoutProps {
  children: React.ReactNode;
}

export function SecuredLayout({ children }: SecuredLayoutProps): React.JSX.Element {
  // const { settings } = useSettings();
  return (
    <VerticalLayout>{children}</VerticalLayout>
  );
}
