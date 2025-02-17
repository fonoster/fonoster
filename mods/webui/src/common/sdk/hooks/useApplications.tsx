import { useMemo } from 'react';
import { useFonosterClient } from '@/common/sdk/hooks/useFonosterClient'
import { useNotification , ErrorType} from '@/common/hooks/useNotification'
import { CreateApplicationRequest , UpdateApplicationRequest, ListApplicationsRequest, ListApplicationsResponse, Application, BaseApiObject } from '@fonoster/types'

export const useApplications = () => {
  const { client, isReady, SDK } = useFonosterClient();
  const { notifyError } = useNotification();
  const applications = useMemo(() => {
    if (!client) {
      throw new Error("Fonoster client is not initialized.");
    }
    return new SDK.Applications(client);
  }, [client]);

  const createApplication = async (data: CreateApplicationRequest): Promise<BaseApiObject | undefined> => {
    try {
      return await applications.createApplication(data);
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const listApplications = async (data: ListApplicationsRequest = {    
    pageSize: 10,
    pageToken: undefined
  }): Promise<ListApplicationsResponse | undefined> => {
    try {
console.log(client, isReady, SDK);  

      if (!isReady) return undefined;
      const _applications = new SDK.Applications(client);
      return await _applications.listApplications(data);
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  
  const getApplication = async (ref: string): Promise<Application | undefined> => {
    try {
      return await applications.getApplication(ref);
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };
  
  const deleteApplication = async (ref: string): Promise<BaseApiObject | undefined> => {  
    try {
      return await applications.deleteApplication(ref);
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  

  const updateApplication = async (data: UpdateApplicationRequest): Promise<BaseApiObject | undefined> => {
    try {
      return await applications.updateApplication(data);
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
