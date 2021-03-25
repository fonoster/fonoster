export interface CreateUserRequest {
    firstName: string,
    lastName: string,
    email : string
  }
  
export interface CreateUserResponse {
    firstName: string,
    lastName: string,
    email : string,
    accessKeyId : string
    role : string,
    createTime : string,
    updateTime : string,
    status : string
  }

  
