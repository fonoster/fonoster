import type { Nullable } from '@/@types'

/**
 * Response status codes
 *
 * @description Indicate the status of the request based on the response codes.
 *
 * @author Fonoster
 */
export enum ResponseCodes {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,
  TIMEOUT = 504,
}

/**
 * Response
 *
 * @description This class contains helper methods to build response objects.
 *
 * @class Response
 * @template T
 *
 * @author Fonoster
 */
export class Response<T> {
  /**
   * Indicate if the request was completed successfully based on the response codes.
   *
   * @type {boolean}
   * @memberof Response
   */
  public readonly success: boolean

  /**
   * Right now timestamp.
   *
   * @memberof Response
   */
  public readonly timestamp = Date.now()

  /**
   * Creates an instance of Response.
   *
   * @author Fonoster
   */
  private constructor(
    /**
     * Response status code.
     *
     * @type {ResponseCodes}
     */
    public readonly status: ResponseCodes,

    /**
     * Response optional title.
     *
     * @type {(Nullable<string>)}
     * @memberof Response
     */
    public readonly title?: Nullable<string>,

    /**
     * Response optional message.
     *
     * @type {(Nullable<string>)}
     * @memberof Response
     */
    public readonly message?: Nullable<string>,

    /**
     * Response content.
     *
     * @type {(Nullable<T>)}
     */
    public readonly data?: Nullable<T>
  ) {
    this.success =
      status >= ResponseCodes.OK && status < ResponseCodes.BAD_REQUEST
  }

  /**
   * Responds with 'OK'
   *
   * @static
   * @template T
   * @memberof Response
   */
  public static ok<T>(data?: T, message?: string): Response<T> {
    return new Response(ResponseCodes.OK, undefined, message, data)
  }

  /**
   * Responds with 'CREATED'
   *
   * @static
   * @template T
   * @memberof Response
   */
  public static created<T>(data?: T, message?: string): Response<T> {
    return new Response(ResponseCodes.CREATED, undefined, message, data)
  }

  /**
   * Responds with 'BAD_REQUEST'
   *
   * @static
   * @memberof Response
   */
  public static badRequest(
    error: string,
    title = 'Bad Request'
  ): Response<undefined> {
    return new Response(ResponseCodes.BAD_REQUEST, title, error)
  }

  /**
   * Responds with 'UNAUTHORIZED'
   *
   * @static
   * @memberof Response
   */
  public static unauthorized(
    error = 'You do not have permission to access this resource',
    title = 'Unauthenticated'
  ): Response<null> {
    return new Response(ResponseCodes.UNAUTHORIZED, title, error)
  }

  /**
   * Responds with 'NOT_FOUND'
   *
   * @static
   * @memberof Response
   */
  public static notFound(
    error: string,
    title = 'Resource Not Found'
  ): Response<null> {
    return new Response(ResponseCodes.NOT_FOUND, title, error)
  }

  /**
   * Responds with 'INTERNAL_ERROR'
   *
   * @static
   * @memberof Response
   */
  public static error(
    error = 'The server encountered an unexpected condition that prevented it from fulfilling the request',
    title = 'Internal Server Error'
  ): Response<null> {
    return new Response(ResponseCodes.INTERNAL_ERROR, title, error)
  }
}
