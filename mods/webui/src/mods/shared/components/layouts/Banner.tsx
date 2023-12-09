import { Title } from '@/ui'

export const Banner = ({ message }: { message: string }) => (
  <div
    className="flex flex-col items-center text-center justify-center p-6"
    style={{ background: '#272727' }}
  >
    <Title className="m-0 p-0 text-gray-500" level={5}>
      {message}
    </Title>
  </div>
)
