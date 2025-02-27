import * as React from 'react';

import { VerticalLayout } from './desktop';

export interface SecuredLayoutProps {
  children: React.ReactNode;
}

export function SecuredLayout({ children }: SecuredLayoutProps): React.JSX.Element {
  return (
    <VerticalLayout>{children}</VerticalLayout>
  );
}
