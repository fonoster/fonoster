import { useMemo } from 'react';
import { useFonosterClient } from '@/common/sdk/hooks/useFonosterClient'
import { useNotification, ErrorType } from '@/common/hooks/useNotification'
import {
    CreateCredentialsRequest,
    UpdateCredentialsRequest,
    ListCredentialsRequest,
    ListCredentialsResponse,
    Credentials as CredentialsType,
    BaseApiObject
} from '@fonoster/types'
import { Credentials } from '@fonoster/sdk';

export const useCredential = () => {
    const { client, isReady, authentication } = useFonosterClient();
    const { notifyError } = useNotification();

    const _credentials = useMemo(() => {
        if (!client) {
            throw new Error("Fonoster client is not initialized.");
        }
        try {
            return new Credentials(client as any);
        } catch (error) {
            throw new Error("Failed to initialize Credentials client");
        }
    }, [client]);

    const createCredentials = async (data: CreateCredentialsRequest): Promise<BaseApiObject | undefined> => {
        try {
            return await authentication.executeWithRefresh(() => _credentials.createCredentials(data));
        } catch (error: any) {
            notifyError(error as ErrorType);
        }
    };

    const getCredentials = async (ref: string): Promise<CredentialsType | undefined> => {
        try {
            return await authentication.executeWithRefresh(() => _credentials.getCredentials(ref));
        } catch (error: any) {
            notifyError(error as ErrorType);
        }
    };

    const updateCredentials = async (data: UpdateCredentialsRequest): Promise<BaseApiObject | undefined> => {
        try {
            return await authentication.executeWithRefresh(() => _credentials.updateCredentials(data));
        } catch (error: any) {
            notifyError(error as ErrorType);
        }
    };

    const listCredentials = async (data: ListCredentialsRequest = {
        pageSize: 10,
        pageToken: undefined
    }): Promise<ListCredentialsResponse | undefined> => {
        try {
            if (!isReady) return undefined;

            return await authentication.executeWithRefresh(() => _credentials.listCredentials(data));
        } catch (error: any) {
            notifyError(error as ErrorType);
        }
    };

    const deleteCredentials = async (ref: string): Promise<BaseApiObject | undefined> => {
        try {
            return await authentication.executeWithRefresh(() => _credentials.deleteCredentials(ref));
        } catch (error: any) {
            notifyError(error as ErrorType);
        }
    };

    return {
        isReady,
        createCredentials,
        getCredentials,
        updateCredentials,
        listCredentials,
        deleteCredentials
    };
};
