import { useCallback } from 'react'
import shallow from 'zustand/shallow'

import { createPanelStore } from '@/mods/shared/hooks/useCreatePanelStore'

const useStore = createPanelStore({
  name: '',
  initialDtmf: '',
  activationIntentId: '',
  activationTimeout: 0,
  interactionTimeout: 0,
  enableEvents: false,
  speechConfig: {
    secretName: '',
    voice: '',
    languageCode: '',
  },
  intentsEngineConfig: {
    secretName: '',
    projectId: '',
    welcomeIntentId: '',
    emulateTelephonyPlatform: false,
    agent: '',
    location: '',
  },
  transferConfig: {
    media: '',
    mediaBusy: '',
    mediaNoAnswer: '',
    message: '',
    messageBusy: '',
    messageNoAnswer: '',
  },
})

export const useCreationEditingApp = () =>
  useStore(
    useCallback(s => s, []),
    shallow
  )
