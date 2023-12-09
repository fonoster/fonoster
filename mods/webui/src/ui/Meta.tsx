import Head from 'next/head'
import { useRouter } from 'next/router'
import { DefaultSeo as Seo } from 'next-seo'

export const Meta = () => {
  const { basePath } = useRouter()

  return (
    <>
      <Head>
        <meta name="msapplication-TileColor" content="#1E1E1E" />

        <meta
          name="msapplication-config"
          content={`${basePath}/favicon/browserconfig.xml`}
        />

        <meta name="theme-color" content="#1E1E1E" />

        <link
          rel="apple-icon-180x180"
          sizes="180x180"
          href={`${basePath}/favicon/apple-icon-180x180.png`}
        />

        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={`${basePath}/favicon/favicon-32x32.png`}
        />

        <link
          rel="icon"
          type="image/png"
          sizes="48x48"
          href={`${basePath}/favicon/android-icon-48x48.png`}
        />

        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={`${basePath}/favicon/favicon-16x16.png`}
        />

        <link
          rel="alternate"
          type="application/rss+xml"
          href={`${basePath}/feed.xml`}
        />

        <link
          rel="icon"
          type="image/png"
          href={`${basePath}/favicon/favicon.ico`}
        />

        <link
          rel="apple-icon-180x180"
          href={`${basePath}/favicon/favicon.ico`}
        />
        <link rel="manifest" href={`${basePath}/favicon/manifest.json`} />
        <link rel="shortcut icon" href={`${basePath}/favicon/favicon.ico`} />
      </Head>

      <Seo
        title="The Open Source Twilio Alternative | Fonoster"
        openGraph={{
          type: 'website',
          /**
           * @todo This info should be moved into a configuration file.
           */
          url: 'https://console.fonoster.com/',
          site_name: 'Fonoster',
          images: [
            {
              url: `https://console.fonoster.com${basePath}/images/og/og-image.jpg`,
              width: 800,
              height: 600,
              alt: 'Fonoster Og Image',
            },
          ],
        }}
        twitter={{
          handle: '@fonoster',
          site: '@fonoster',
          cardType: 'summary_large_image',
        }}
      />
    </>
  )
}
