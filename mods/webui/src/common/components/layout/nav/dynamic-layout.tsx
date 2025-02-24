'use client';

import * as React from 'react';

// import { HorizontalLayout } from './horizontal/horizontal-layout';
import { VerticalLayout } from './vertical/vertical-layout';

export interface DynamicLayoutProps {
  children: React.ReactNode;
}

export function DynamicLayout({ children }: DynamicLayoutProps): React.JSX.Element {
  // const { settings } = useSettings();
  return (
    <VerticalLayout>{children}</VerticalLayout>
  );
}
