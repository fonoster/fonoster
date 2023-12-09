import React from 'react'
import { toast, ToastContainer, ToastContainerProps } from 'react-toastify'

export const Notification: React.FC<ToastContainerProps> = props => (
  <ToastContainer
    position="bottom-left"
    autoClose={5000}
    hideProgressBar
    newestOnTop={false}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    {...props}
  />
)

export { toast as Notifier }
