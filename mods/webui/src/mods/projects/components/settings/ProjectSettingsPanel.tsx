import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Confirm } from '@/mods/shared/components/Confirm'
import { Notifier } from '@/mods/shared/components/Notification'
import { Button, Checkbox, Input, Text, Title } from '@/ui'

import { useDeleteProject } from '../../hooks/useDeleteProject'
import { useEditProject } from '../../hooks/useEditProject'
import { useRefreshSecret } from '../../hooks/useRefreshSecret'
import { useCurrentProject } from '../current-project'
import { useProjectSettingsPanel } from '.'

export const ProjectSettingsPanel = () => {
  const { defaultValues, close } = useProjectSettingsPanel()
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({ defaultValues })

  const { mutate: edit, isLoading: isEditLoading } = useEditProject()

  const onSave = useCallback(
    project => {
      edit(project, {
        onSuccess() {
          close()

          Notifier.success('Your Project has been successfully edited.')
        },
      })
    },
    [edit, close]
  )

  const { currentProject } = useCurrentProject()

  const { mutate, isLoading: isDeleteLoading } = useDeleteProject()
  const { mutate: mutateRefreshSecret, isLoading: isRefreshSecretLoading } =
    useRefreshSecret()
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isSecretConfirmOpen, setSecretConfirmOpen] = useState(false)

  const isLoading = useMemo(
    () => isDeleteLoading || isEditLoading || isRefreshSecretLoading,
    [isDeleteLoading, isEditLoading, isRefreshSecretLoading]
  )

  const onRefreshSecret = useCallback(() => {
    if (currentProject?.ref)
      mutateRefreshSecret(currentProject.ref, {
        onSuccess() {
          setSecretConfirmOpen(false)

          Notifier.success(
            'Your secret access key has been successfully renewed.'
          )
        },
      })
  }, [mutateRefreshSecret, currentProject?.ref])

  const onDelete = useCallback(() => {
    if (currentProject?.ref)
      mutate(currentProject.ref, {
        onSuccess() {
          close()
          setDeleteModalOpen(false)

          Notifier.success('Your Project has been successfully deleted.')
        },
      })
  }, [mutate, currentProject?.ref, close])

  useEffect(() => {
    reset(currentProject ?? {})
  }, [currentProject, reset])

  return (
    <>
      {currentProject && (
        <>
          <div>
            <div>
              <Title level={4} className="leading-6 m-0">
                Project details
              </Title>
              <Text className="text-gray-200">
                Check our docs for detail information about how to get started
                with Projects.
              </Text>
            </div>
            <div className="mt-5">
              <dl>
                <div className="pb-4 mt-4 sm:grid sm:grid-cols-1 sm:gap-4">
                  <dd className="text-sm text-white sm:mt-0 sm:col-span-1">
                    <Controller
                      name="name"
                      control={control}
                      rules={{ required: true }}
                      render={({
                        field: { name, onBlur, onChange, value },
                      }) => (
                        <Input
                          className="mb-4"
                          label="Project name"
                          placeholder="Type a friendly name"
                          disabled={isLoading}
                          error={
                            errors?.name &&
                            'You must enter a name for your Project, try something friendly and related to your organization'
                          }
                          {...{
                            name,
                            onBlur,
                            onChange,
                            value,
                          }}
                        />
                      )}
                    />
                  </dd>
                </div>

                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                  <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                    <Controller
                      name="allowExperiments"
                      control={control}
                      render={({
                        field: { name, onBlur, onChange, value },
                      }) => (
                        <Checkbox
                          label="Enable experimental APIs"
                          description="Access features that aren’t yet generally available."
                          disabled={isLoading}
                          checked={Boolean(value)}
                          {...{
                            name,
                            onBlur,
                            onChange,
                          }}
                        />
                      )}
                    />
                  </dd>
                </div>

                <div className="flex-shrink-0 flex justify-end">
                  <Button
                    className="ml-4"
                    loading={isEditLoading}
                    disabled={!isDirty}
                    type={isDirty ? 'primary' : 'secondary'}
                    onClick={handleSubmit(onSave)}
                  >
                    Save changes
                  </Button>
                </div>

                <div className="pt-4 sm:pt-5 sm:grid sm:grid-cols-1 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-200">
                    Access Key ID
                  </dt>
                  <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                    <Input readOnly copy value={currentProject.accessKeyId} />
                  </dd>
                </div>
                <div className="pt-4 sm:py-5 sm:grid sm:grid-cols-1 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-200">
                    Access Key Secret
                  </dt>
                  <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2 flex flex-col items-end">
                    <Input
                      reveal
                      readOnly
                      copy
                      value={currentProject.accessKeySecret}
                      className="w-full"
                    />
                    <Button
                      key="refresh-secret"
                      size="small"
                      type="secondary"
                      onClick={() => setSecretConfirmOpen(true)}
                      loading={isRefreshSecretLoading}
                      className="mt-2 text"
                    >
                      {isRefreshSecretLoading
                        ? 'Loading...'
                        : 'Re-generate Secret'}
                    </Button>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          <div>
            <div>
              <Title level={4} className="leading-6 m-0">
                Danger Zone
              </Title>
              <Text>The following actions are irreversible and permanent.</Text>
            </div>
            <div className="mt-5 border-t border-gray-400">
              <dl className="sm:divide-y sm:divide-gray-600">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-8">
                  <dt className="sm:col-span-2">
                    <Title level={5} className="m-0">
                      Delete Project
                    </Title>
                    <Text options={{ small: true }}>
                      Your Project and all related resources will be deleted.
                    </Text>
                  </dt>
                  <dd className="flex items-center justify-end mt-1">
                    <Button
                      type="secondary"
                      onClick={() => setDeleteModalOpen(true)}
                      className="cancel"
                    >
                      Delete Project
                    </Button>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <Confirm
            isOpen={isDeleteModalOpen}
            isLoading={isLoading}
            onClick={onDelete}
            onClose={() => setDeleteModalOpen(false)}
            textToConfirm={currentProject.name || 'Project'}
            description="Are you sure you want to delete this Project? It will be permanently removed from our servers. This action cannot be undone."
          />

          <Confirm
            isOpen={isSecretConfirmOpen}
            isLoading={isLoading}
            onClick={onRefreshSecret}
            onClose={() => setSecretConfirmOpen(false)}
            textToConfirm={currentProject.name || 'Project'}
          />
        </>
      )}
    </>
  )
}
