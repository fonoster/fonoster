import { useMemo } from "react";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import {
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ListApplicationsRequest as BaseListApplicationsRequest,
  ListApplicationsResponse as BaseListApplicationsResponse,
  Application,
  BaseApiObject,
  ApplicationType
} from "@fonoster/types";
import { Applications } from "@fonoster/sdk";
import { usePaginatedData } from "@/common/hooks/usePaginatedData";

// Define the extended response type for our paginated data
interface ListApplicationsResponse extends BaseListApplicationsResponse {
  prevPageToken?: string;
  recordTotal?: number;
  filterBy?: Record<string, string>;
}

// Define the sort option type
interface SortOption {
  field: string;
  order: "ASC" | "DESC";
}

// Define the request type for our paginated data
interface ListApplicationsRequest extends BaseListApplicationsRequest {
  filterBy?: Record<string, string>;
  pageSize?: number;
  pageToken?: string;
  sortBy?: SortOption[];
}

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

  // Handle Fake data - make sure all required Application properties are non-optional
  const { listItems } = usePaginatedData<Application>({
    generateFakeData: (index) => ({
      ref: `app-${index}`,
      name: `Application ${index + 1}`, // This is required to be non-optional
      textToSpeech: {
        productRef: `textToSpeech ${index + 1}`,
        config: {
          voice: "aura_asteria_en"
        }
      },
      speechToText: {
        productRef: `speechToText ${index + 1}`,
        config: {
          model: "nova-2",
          language: "en-US"
        }
      },
      // Add any other required fields from Application type
      type:
        index % 2 === 0 ? ApplicationType.EXTERNAL : ApplicationType.AUTOPILOT,
      createdAt: new Date(Date.now() - index * 86400000),
      updatedAt: new Date(Date.now() - index * 43200000)
    }),
    totalItems: 30,
    defaultPageSize: 10
  });

  const createApplication = async (
    data: CreateApplicationRequest
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _applications.createApplication(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const listApplications = async (
    data: ListApplicationsRequest = {
      pageSize: 10,
      pageToken: undefined
    }
  ): Promise<ListApplicationsResponse | undefined> => {
    try {
      // The return type of listItems is now compatible with ListApplicationsResponse
      return (await listItems(data)) as ListApplicationsResponse;
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const getApplication = async (
    ref: string
  ): Promise<Application | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _applications.getApplication(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const deleteApplication = async (
    ref: string
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _applications.deleteApplication(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const updateApplication = async (
    data: UpdateApplicationRequest
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _applications.updateApplication(data)
      );
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
