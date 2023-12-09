import axios from 'axios'

import { getCurrentProjectFromStorage } from '@/mods/projects/components/current-project'
import { Notifier } from '@/mods/shared/components/Notification'

import { config } from '../../constants/config'

const API = axios.create({
  baseURL: `${config.WEBUI_APP_URL}/api/sdk`,
})

API.interceptors.request.use(config => {
  const project = getCurrentProjectFromStorage()

  return project
    ? {
        ...config,
        headers: {
          ...config?.headers,
          'X-Project-Id': project.accessKeyId,
          'X-Project-Secret': project.accessKeySecret,
        },
      }
    : config
})

API.interceptors.response.use(
  res => res,
  async err => {
    const message = err.response?.data?.message

    /**
     * @todo Create an error handler based on the messages or codes thrown by the sdk
     */
    if (message) Notifier.error(message)

    return Promise.reject(err)
  }
)

export { API }
