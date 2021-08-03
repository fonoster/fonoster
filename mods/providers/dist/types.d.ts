export interface Provider {
    ref: string;
    name: string;
    username: string;
    secret: string;
    host: string;
    transport: string;
    expires: number;
    createTime?: string;
    updateTime?: string;
}
export interface CreateProviderRequest {
    ref?: string;
    name: string;
    username: string;
    secret: string;
    host: string;
    transport: string;
    expires: number;
    createTime?: string;
    updateTime?: string;
}
export interface CreateProviderResponse {
    ref: string;
    name: string;
    username: string;
    secret: string;
    host: string;
    transport: string;
    expires: number;
    createTime: string;
    updateTime: string;
}
export interface GetProviderResponse {
    ref: string;
    name: string;
    username: string;
    secret: string;
    host: string;
    transport: string;
    expires: number;
    createTime: string;
    updateTime: string;
}
export interface UpdateProviderRequest {
    ref: string;
    name?: string;
    username?: string;
    secret?: string;
    host?: string;
    transport?: string;
    expires?: number;
    createTime?: string;
    updateTime?: string;
}
export interface UpdateProviderResponse {
    ref: string;
}
export interface ListProviderRequest {
    pageSize?: number;
    pageToken?: string;
    view?: number;
}
export interface ListProviderResponse {
    nextPageToken: string;
    providers: Provider[];
}
export interface DeleteProviderResponse {
    ref: string;
}
