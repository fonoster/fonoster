import type { Project } from '@fonoster/projects/dist/client/types'
import { useCallback, useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Notifier } from '@/mods/shared/components/Notification'
import { wait } from '@/mods/shared/helpers/wait'
import { Checkbox, Input, Panel } from '@/ui'

import { useCreateProject } from '../../hooks/useCreateProject'
import { useEditProject } from '../../hooks/useEditProject'
import { useCreationEditingProject } from './useCreationEditingProject'

export const CreationEditingProject = () => {
  const { isOpen, isEdit, defaultValues, close } = useCreationEditingProject()
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Project>({ defaultValues })

  useEffect(() => {
    reset(isEdit ? defaultValues : {})
  }, [isEdit, defaultValues, reset])

  const { mutate: create, isLoading: isCreateLoading } = useCreateProject()
  const { mutate: edit, isLoading: isEditLoading } = useEditProject()

  const isLoading = useMemo(
    () => isCreateLoading || isEditLoading,
    [isCreateLoading, isEditLoading]
  )

  const onClose = useCallback(() => {
    close()
    wait(reset)
  }, [close, reset])

  const onSave = useCallback(
    project => {
      isEdit
        ? edit(project, {
            onSuccess() {
              onClose()

              Notifier.success('Your Project has been successfully edited.')
            },
          })
        : create(project, {
            onSuccess() {
              onClose()

              Notifier.success(
                'Your new Project has been successfully created.'
              )
            },
          })
    },
    [create, edit, isEdit, onClose]
  )

  const headings = useMemo(
    () => ({
      title: isEdit
        ? 'Edit a Project to get started managing your resources.'
        : 'Create a Project to get started managing your resources.',
      description:
        'Projects allow you to scope Voice Apps, SIP Agents, Providers, Numbers, Functions, Domains, and others to a specific application in your organization.',
      buttonText: isEdit ? 'Save' : 'Create Project',
    }),
    [isEdit]
  )

  return (
    <Panel
      close={onClose}
      isOpen={isOpen}
      title={headings.title}
      description={headings.description}
      saveButtonProps={{
        children: headings.buttonText,
        loading: isLoading,
        onClick: handleSubmit(onSave),
      }}
    >
      <Controller
        name="name"
        control={control}
        rules={{ required: true }}
        render={({ field: { name, onBlur, onChange, value } }) => (
          <Input
            className="mb-4"
            label="Your Project name"
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

      <Controller
        name="allowExperiments"
        control={control}
        render={({ field: { name, onBlur, onChange, value } }) => (
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
    </Panel>
  )
}
