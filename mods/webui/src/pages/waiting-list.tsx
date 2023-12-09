import type { NextPage } from 'next'

import { Container, Text, Title } from '@/ui'

const WaitingList: NextPage = () => (
  <Container>
    <div className="max-w-lg text-center">
      <Title>Join the waiting list</Title>
      <Text>
        Hey! Thank you for your interest in using the Fonoster console. At the
        moment, this version is a proof of concept (PoC) only for users on the
        waiting list; if you are interested in joining, use the following link.
      </Text>
      <a
        className="text-white bg-primary p-2 mt-6 block rounded"
        href="https://github.com/fonoster/fonoster/discussions/209"
        target="_blank"
        rel="noopener noreferrer"
      >
        Join
      </a>
    </div>
  </Container>
)

export default WaitingList
