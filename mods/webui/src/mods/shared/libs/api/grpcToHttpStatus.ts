import { ResponseCodes } from './Response'

export const getHttpStatus = (code: number) => {
  const statuses = {
    0: ResponseCodes.OK,
    1: ResponseCodes.BAD_REQUEST,
    2: ResponseCodes.INTERNAL_ERROR,
    3: ResponseCodes.BAD_REQUEST,
    4: ResponseCodes.TIMEOUT,
    5: ResponseCodes.NOT_FOUND,
    7: ResponseCodes.FORBIDDEN,
    16: ResponseCodes.UNAUTHORIZED,
  }

  return statuses[code] || ResponseCodes.INTERNAL_ERROR
}
