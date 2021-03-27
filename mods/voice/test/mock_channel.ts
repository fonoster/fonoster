const CHANNEL_STATUS_AVAILABLE = 0; // Channel is down and available
const CHANNEL_STATUS_UP = 6; // Line is up

class ChannelMock {
  status: number;
  request: {
    callerId?: string;
    extension?: string;
  };
  data: any;
  dataPointer: any;
  constructor(callerId?: string, extension?: string) {
    this.status = CHANNEL_STATUS_AVAILABLE;
    this.resetDataPointer();
    this.request = {};
    this.request.callerId = callerId ? callerId : "1234";
    this.request.extension = extension ? extension : "4321";
  }

  answer() {
    this.status = CHANNEL_STATUS_UP;
    return 0; // success
  }

  hangup() {
    this.status = CHANNEL_STATUS_AVAILABLE;
    return 1; // success
  }

  setAutoHangup(timeout: number) {
    throw new Error("not yet implemented");
  }

  getData(file: string, timeout: number, maxDigits: number) {
    const d = this.data[this.dataPointer];
    this.dataPointer = this.dataPointer + 1;
    return d;
  }

  streamFile(file: string, escapeDigits: string) {
    const d = this.data[this.dataPointer];
    this.dataPointer = this.dataPointer + 1;
    return { code: 200, attributes: { result: d } };
  }

  setData(data: any) {
    this.data = data;
  }

  resetDataPointer() {
    this.dataPointer = 0;
  }

  recordFile(
    file: string,
    format: string,
    finishOnKey: string,
    maxDuration: number,
    offset: number,
    beep: string
  ) {
    return {
      code: 200,
      attributes: {
        result: {
          file,
          format,
          finishOnKey,
          maxDuration,
          offset,
          beep
        }
      }
    };
  }
}

export { CHANNEL_STATUS_AVAILABLE, CHANNEL_STATUS_UP, ChannelMock };
