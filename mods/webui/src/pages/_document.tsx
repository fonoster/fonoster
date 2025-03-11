import * as React from "react";
import { Html, Head, Main, NextScript } from "next/document";

import {
  DocumentHeadTags,
  documentGetInitialProps,
  DocumentHeadTagsProps
} from "@mui/material-nextjs/v15-pagesRouter";

import { fnLight } from "../../theme/theme";

export default function MyDocument(props: DocumentHeadTagsProps) {
  return (
    <Html lang="es" data-toolpad-color-scheme="light">
      <Head>
        <DocumentHeadTags {...props} />
        <meta name="theme-color" content={fnLight.palette.primary.main} />
        <meta
          name="description"
          content="Fonoster: The open-source alternative to Twilio"
        />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style>
          {`
            html {
              font-family: "Poppins", Helvetica, Arial, system-ui, sans-serif, "Segoe UI",
                Roboto, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            }
          `}
        </style>
        <meta name="emotion-insertion-point" content="" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

MyDocument.getInitialProps = documentGetInitialProps;
