import * as React from 'react'
import {
  Html,
  Head,
  Main,
  NextScript,
} from 'next/document'

import {
  DocumentHeadTags,
  documentGetInitialProps,
  DocumentHeadTagsProps,
} from '@mui/material-nextjs/v15-pagesRouter';

import { fnLight } from '../../theme/theme'

export default function MyDocument(props: DocumentHeadTagsProps) {
    return (
      <Html lang="es" data-toolpad-color-scheme="light">
        <Head>
          <DocumentHeadTags {...props} />
          <meta name="theme-color" content={fnLight.palette.primary.main} />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
          />
          <meta name="emotion-insertion-point" content="" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
}

MyDocument.getInitialProps = documentGetInitialProps;