import { useCallback, useState } from 'react'

import { voices as data } from '../constants/voices'

const getVoices = (start = 0, perPage = 15) =>
  data.slice(start, start + perPage)

export const useVoices = () => {
  const [voices, setVoices] = useState(getVoices())
  const [hasMoreVoices, setHasMoreVoices] = useState(true)

  const fetchMoreVoices = useCallback(() => {
    const newVoices = getVoices(voices.length)

    if (newVoices.length === 0) return setHasMoreVoices(false)

    setVoices([...voices, ...newVoices])
  }, [voices])

  const resetVoices = useCallback(() => {
    setVoices(getVoices())
    setHasMoreVoices(true)
  }, [])

  const getAudio = useCallback(
    (voice: string) => ({
      src: `https://cloud.google.com/text-to-speech/docs/audio/${voice}.wav`,
      type: 'audio/wav',
    }),
    []
  )

  return {
    voices,
    total: voices.length,
    resetVoices,
    hasMoreVoices,
    fetchMoreVoices,
    getAudio,
  }
}
