import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta name="robots" content="follow, index" />
          <meta
            name="description"
            content="Developer and Product Designer from Brazil."
          />
          <meta
            property="og:site_name"
            content="Luiz Felipe Baroncello — Developer, Designer"
          />
          <meta
            property="og:description"
            content="Developer and Product Designer from Brazil."
          />
          <meta
            property="og:title"
            content="Luiz Felipe Baroncello — Developer, Designer"
          />
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:title"
            content="Luiz Felipe Baroncello — Developer, Designer"
          />
          <meta
            name="twitter:description"
            content="Developer and Product Designer from Brazil."
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
