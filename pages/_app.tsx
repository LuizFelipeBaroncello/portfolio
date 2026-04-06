import type { AppProps } from 'next/app'
import Head from 'next/head'
import { Analytics } from '@vercel/analytics/next'
import { appWithTranslation } from 'next-i18next/pages'
import nextI18NextConfig from '../next-i18next.config'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import '../styles/main.css'
import '../styles/ev-stats.css'
import '../styles/amortizacao.css'
import '../styles/sun-map.css'
import '../styles/sun-map-interior.css'
import 'maplibre-gl/dist/maplibre-gl.css'

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link
          rel="preload"
          href="/fonts/Inter-roman.latin.var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}

export default appWithTranslation(App, nextI18NextConfig)
