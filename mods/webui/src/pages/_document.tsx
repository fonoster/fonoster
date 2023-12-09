import Document, { Head, Html, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html className="dark h-full">
        <Head />
        <body className="h-full overflow-hidden bg-gray-800">
          <audio style={{ display: 'none' }} id="remoteAudio" controls>
            <p>Your browser doesnt support HTML5 audio.</p>
          </audio>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
