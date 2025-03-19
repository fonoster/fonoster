import React from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Layout as LayoutAuth } from "@/common/components/layout/auth/Layout";
import { FonosterProvider } from "@/common/sdk/provider/FonosterContext";
import { WorkspaceProvider } from "@/common/sdk/provider/WorkspaceContext";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import type { AppProps } from "next/app";
import { fnLight } from "@theme/theme";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const isPageNotAuthentication =
    router.pathname === "/signin" ||
    router.pathname === "/signup" ||
    router.pathname === "/signup/verify" ||
    router.pathname === "/forgot-password" ||
    router.pathname === "/reset-password" ||
    router.pathname === "/404" ||
    router.pathname === "/oauth/callback";

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={fnLight}>
        <CssBaseline />
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, viewport-fit=cover"
          />
        </Head>
        <FonosterProvider>
          {isPageNotAuthentication ? (
            <Component {...pageProps} />
          ) : (
            <WorkspaceProvider>
              <LayoutAuth>
                <Component {...pageProps} />
              </LayoutAuth>
            </WorkspaceProvider>
          )}
        </FonosterProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
