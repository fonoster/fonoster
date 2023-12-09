import 'react-phone-input-2/lib/style.css'

import { classes } from '@/mods/shared/helpers/classes'

export { default as PhoneInput } from 'react-phone-input-2'

export const PhoneInputContainer: React.FC<{
  label: string
  error?: string
}> = ({ label, error, ...props }) => (
  <div
    className={classes(
      'mb-4 custom-input-phone__main',
      error ? 'custom-input-phone__main--error' : ''
    )}
  >
    <div className="sbui-formlayout sbui-formlayout--medium sbui-formlayout--responsive">
      <div className="sbui-space-row sbui-space-x-2 sbui-formlayout__label-container-horizontal">
        <label className="sbui-formlayout__label">{label}</label>
      </div>
      <div className="sbui-formlayout__content-container-horizontal">
        <div className="sbui-input-container" {...props} />
        {error && <p className="sbui-formlayout__error">{error}</p>}
      </div>
    </div>
  </div>
)
