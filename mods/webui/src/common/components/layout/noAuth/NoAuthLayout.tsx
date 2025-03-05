import * as React from "react";
import { NextAppProvider } from "@toolpad/core/nextjs";
import Head from "next/head";
import { fnLight, fnDark } from "../../../../../theme/theme";

export function NoAuthLayout({ children }: { children: React.ReactNode }) {
  const BRANDING = {
    title: "Fonoster"
  };
  return (
    <NextAppProvider
      branding={BRANDING}
      theme={{
        light: fnLight,
        dark: fnDark
      }}
    >
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <meta charSet="utf-8" />
        <meta name="description" content="Fonoster" />
        <title>Fonoster</title>
      </Head>
      {children}
    </NextAppProvider>
  );
}
