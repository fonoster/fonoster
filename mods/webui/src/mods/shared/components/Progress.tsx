import NextNProgress from 'nextjs-progressbar'

export const Progress = () => (
  <NextNProgress
    height={0.5}
    color="#7befc3"
    options={{ showSpinner: false }}
    showOnShallow={false}
  />
)
