// I will create a service that will attach to asterisk events emitter
// For every StatisStart event:
//    - I will get callers ID
//    - Gerate a SERVICE token
//    - Obatin the mediacontroller's webhook
//    - Call the webhook with the following information
//        - access_key_id (owner of the mediacontroller)
//        - access_key_secret (a short live token)
//        - session_id (same as the channel id)
//        - dialback_endpoint (url of the mediaserver)
export interface CallRequest {
  accessKeyId: string;
  accessKeySecret: string;
  sessionId: string;
  dialbackEnpoint: string;
  callerId: string;
}
