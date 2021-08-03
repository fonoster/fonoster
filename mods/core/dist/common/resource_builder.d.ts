declare enum Kind {
    AGENT = "Agent",
    GATEWAY = "Gateway",
    PEER = "Peer",
    DOMAIN = "Domain",
    NUMBER = "Number"
}
declare enum Privacy {
    PRIVATE = "Private",
    NONE = "None"
}
declare class ResourceBuilder {
    kind: Kind;
    apiVersion: string;
    metadata: {
        name: string;
        ref: string;
        gwRef?: string;
    };
    spec: {
        context?: {
            domainUri?: string;
            egressPolicy?: {
                rule: string;
                numberRef: string;
            };
            accessControlList?: {
                allow?: string[];
                deny?: string[];
            };
        };
        credentials?: {
            username: string;
            secret: string;
        };
        host?: string;
        transport?: string;
        location?: {
            telUrl: string;
            aorLink?: string;
        };
        expires?: number;
        privacy?: Privacy;
        domains?: string[];
    };
    constructor(kind: Kind, name: string, ref?: string, apiVersion?: string);
    withMetadata(metadata: object): this;
    withCredentials(username: string, secret: string): this;
    withHost(host: string): this;
    withTransport(transport: string): this;
    withExpires(expires: number): this;
    withLocation(telUrl: string, aorLink: string): this;
    withGatewayRef(ref: string): this;
    withDomainUri(domainUri: string): this;
    withEgressPolicy(rule: string, numberRef: string): this;
    withACL(allow: string[], deny: string[]): this;
    withPrivacy(privacy: Privacy): this;
    withDomains(domains: string[]): this;
    build(): this;
}
export { ResourceBuilder, Kind, Privacy };
