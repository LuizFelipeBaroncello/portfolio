import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
            }}
          />
          <meta name="robots" content="follow, index" />
          <meta name="description" content="Software Engineer from Santa Catarina, Brazil. Currently at Mercado Livre." />
          <meta property="og:site_name" content="Luiz Felipe Baroncello — Software Engineer" />
          <meta property="og:description" content="Software Engineer from Santa Catarina, Brazil. Currently at Mercado Livre." />
          <meta property="og:title" content="Luiz Felipe Baroncello — Software Engineer" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Luiz Felipe Baroncello — Software Engineer" />
          <meta name="twitter:description" content="Software Engineer from Santa Catarina, Brazil. Currently at Mercado Livre." />
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
