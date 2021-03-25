
export interface CreateProviderRequest {
    name : string;
    username: string;
    secret: string;
    host: string;
    transport: string;
    expires: number;
}

export interface CreateProviderResponse {
    name : string;
    username: string;
    secret: string;
    host: string;
    transport: string;
    expires: string;
}

export interface UpdateProviderRequest {
    ref: string;
    name : string;
    username: string;
    secret: string;
    host: string;
    transport: string;
    expires: number;
}

export interface UpdateProviderResponse {
    ref:string;
    name : string;
    username: string;
    secret: string;
    host: string;
    transport: string;
    expires: string;
}