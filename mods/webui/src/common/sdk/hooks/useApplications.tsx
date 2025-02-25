import { useMemo } from 'react';
import { useFonosterClient } from '@/common/sdk/hooks/useFonosterClient'
import { useNotification, ErrorType } from '@/common/hooks/useNotification'
import { CreateApplicationRequest, UpdateApplicationRequest, ListApplicationsRequest, ListApplicationsResponse, Application, BaseApiObject } from '@fonoster/types'
import { Applications } from '@fonoster/sdk';

export const useApplications = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

  const _applications = useMemo(() => {
    if (!client) {
      throw new Error("Fonoster client is not initialized.");
    }
    try {
      return new Applications(client as any);
    } catch (error) {
      throw new Error("Failed to initialize Applications client");
    }
  }, [client]);

  const createApplication = async (data: CreateApplicationRequest): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() => _applications.createApplication(data));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const listApplications = async (data: ListApplicationsRequest = {
    pageSize: 10,
    pageToken: undefined
  }): Promise<ListApplicationsResponse | undefined> => {
    try {
      if (!isReady) return undefined;

      return await authentication.executeWithRefresh(() => _applications.listApplications(data));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };


  const getApplication = async (ref: string): Promise<Application | undefined> => {
    try {
      return await authentication.executeWithRefresh(() => _applications.getApplication(ref));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const deleteApplication = async (ref: string): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() => _applications.deleteApplication(ref));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };



  const updateApplication = async (data: UpdateApplicationRequest): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() => _applications.updateApplication(data));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  return {
    isReady,
    createApplication,
    listApplications,
    updateApplication,
    getApplication,
    deleteApplication
  };
};
