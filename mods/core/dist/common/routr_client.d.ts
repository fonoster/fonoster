/**
 * Oversimplified version of a Routr API Client
 */
export default class RoutrClient {
    apiUrl: string;
    username: string;
    secret: string;
    token: string;
    resource: string;
    constructor(apiUrl: string, username: string, secret: string);
    connect(): Promise<this>;
    resourceType(resource: string): this;
    private getToken;
    list(params: object | {}): Promise<any>;
    getDomainUriFromNumber(number: string): Promise<any>;
    getNumber(number: string): Promise<any>;
    get(ref: string): Promise<any>;
    delete(ref: string): Promise<void>;
    create(data: any): Promise<any>;
    update(data: any): Promise<any>;
}
