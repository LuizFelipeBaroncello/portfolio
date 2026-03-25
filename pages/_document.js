import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html lang="pt-BR">
        <Head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
            }}
          />
          <meta name="robots" content="follow, index" />
          <meta name="description" content="Portfolio de Luiz Felipe Baroncello, Software Engineer em Santa Catarina, Brasil. Projetos em Java, React, Spring, Microservices e Cloud." />
          <meta property="og:site_name" content="Luiz Felipe Baroncello — Software Engineer" />
          <meta property="og:description" content="Portfolio de Luiz Felipe Baroncello, Software Engineer em Santa Catarina, Brasil. Projetos em Java, React, Spring, Microservices e Cloud." />
          <meta property="og:title" content="Luiz Felipe Baroncello — Software Engineer" />
          <meta property="og:image" content="/og-image.svg" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Luiz Felipe Baroncello — Software Engineer" />
          <meta name="twitter:description" content="Portfolio de Luiz Felipe Baroncello, Software Engineer em Santa Catarina, Brasil. Projetos em Java, React, Spring, Microservices e Cloud." />
          <meta name="twitter:image" content="/og-image.svg" />
          <link rel="icon" href="/favicon.svg" />
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
