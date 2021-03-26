export interface CreateNumberRequest {
    ref: string;
    providerRef: string;
    e164Number: string;
    ingressApp: string;
    aorLink: string;
  }
  enum View {
    BASIC = 0,
    STANDARD = 1,
    FULL = 2,
  }
  
  export interface UpdateNumberRequest {
    ref: string;
    aorLink?: string;
    ingressApp?: string;
  }

  export interface UpdateNumberResponse {
    ref: string;
  }
  
  export interface ListNumbersRequest {
    pageSize: number;
    pageToken: string;
    view: View
  }

  export interface deleteNumberResponse{
    ref:string
  }
  
  export interface CreateNumberResponse{
    ref: string;
    providerRef: string;
    e164Number: string;
    ingressApp: string;
    aorLink: string; 
  }
  export interface GetNumberResponse{
    ref: string;
    providerRef: string;
    e164Number: string;
    ingressApp: string;
    aorLink: string; 
    createTime: string;
    updateTime: string;
  }
  export interface IngressAppRequest {
    e164Number: string
  }
  
  export interface AsObject {
  }