
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Application
 * 
 */
export type Application = $Result.DefaultSelection<Prisma.$ApplicationPayload>
/**
 * Model TextToSpeech
 * 
 */
export type TextToSpeech = $Result.DefaultSelection<Prisma.$TextToSpeechPayload>
/**
 * Model SpeechToText
 * 
 */
export type SpeechToText = $Result.DefaultSelection<Prisma.$SpeechToTextPayload>
/**
 * Model Intelligence
 * 
 */
export type Intelligence = $Result.DefaultSelection<Prisma.$IntelligencePayload>
/**
 * Model Product
 * 
 */
export type Product = $Result.DefaultSelection<Prisma.$ProductPayload>
/**
 * Model Secret
 * 
 */
export type Secret = $Result.DefaultSelection<Prisma.$SecretPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const ApplicationType: {
  EXTERNAL: 'EXTERNAL'
};

export type ApplicationType = (typeof ApplicationType)[keyof typeof ApplicationType]


export const ProductType: {
  TTS: 'TTS',
  STT: 'STT',
  ASSISTANT: 'ASSISTANT'
};

export type ProductType = (typeof ProductType)[keyof typeof ProductType]


export const ProductVendor: {
  GOOGLE: 'GOOGLE',
  MICROSOFT: 'MICROSOFT',
  AMAZON: 'AMAZON',
  DEEPGRAM: 'DEEPGRAM',
  IBM: 'IBM',
  RASA: 'RASA',
  OPENAI: 'OPENAI',
  GROQ: 'GROQ',
  ELEVEN_LABS: 'ELEVEN_LABS',
  GENERIC: 'GENERIC'
};

export type ProductVendor = (typeof ProductVendor)[keyof typeof ProductVendor]

}

export type ApplicationType = $Enums.ApplicationType

export const ApplicationType: typeof $Enums.ApplicationType

export type ProductType = $Enums.ProductType

export const ProductType: typeof $Enums.ProductType

export type ProductVendor = $Enums.ProductVendor

export const ProductVendor: typeof $Enums.ProductVendor

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Applications
 * const applications = await prisma.application.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Applications
   * const applications = await prisma.application.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.application`: Exposes CRUD operations for the **Application** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Applications
    * const applications = await prisma.application.findMany()
    * ```
    */
  get application(): Prisma.ApplicationDelegate<ExtArgs>;

  /**
   * `prisma.textToSpeech`: Exposes CRUD operations for the **TextToSpeech** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TextToSpeeches
    * const textToSpeeches = await prisma.textToSpeech.findMany()
    * ```
    */
  get textToSpeech(): Prisma.TextToSpeechDelegate<ExtArgs>;

  /**
   * `prisma.speechToText`: Exposes CRUD operations for the **SpeechToText** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SpeechToTexts
    * const speechToTexts = await prisma.speechToText.findMany()
    * ```
    */
  get speechToText(): Prisma.SpeechToTextDelegate<ExtArgs>;

  /**
   * `prisma.intelligence`: Exposes CRUD operations for the **Intelligence** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Intelligences
    * const intelligences = await prisma.intelligence.findMany()
    * ```
    */
  get intelligence(): Prisma.IntelligenceDelegate<ExtArgs>;

  /**
   * `prisma.product`: Exposes CRUD operations for the **Product** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Products
    * const products = await prisma.product.findMany()
    * ```
    */
  get product(): Prisma.ProductDelegate<ExtArgs>;

  /**
   * `prisma.secret`: Exposes CRUD operations for the **Secret** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Secrets
    * const secrets = await prisma.secret.findMany()
    * ```
    */
  get secret(): Prisma.SecretDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.1.0
   * Query Engine version: 11f085a2012c0f4778414c8db2651556ee0ef959
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Application: 'Application',
    TextToSpeech: 'TextToSpeech',
    SpeechToText: 'SpeechToText',
    Intelligence: 'Intelligence',
    Product: 'Product',
    Secret: 'Secret'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "application" | "textToSpeech" | "speechToText" | "intelligence" | "product" | "secret"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Application: {
        payload: Prisma.$ApplicationPayload<ExtArgs>
        fields: Prisma.ApplicationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ApplicationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApplicationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ApplicationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApplicationPayload>
          }
          findFirst: {
            args: Prisma.ApplicationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApplicationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ApplicationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApplicationPayload>
          }
          findMany: {
            args: Prisma.ApplicationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApplicationPayload>[]
          }
          create: {
            args: Prisma.ApplicationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApplicationPayload>
          }
          createMany: {
            args: Prisma.ApplicationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ApplicationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApplicationPayload>[]
          }
          delete: {
            args: Prisma.ApplicationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApplicationPayload>
          }
          update: {
            args: Prisma.ApplicationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApplicationPayload>
          }
          deleteMany: {
            args: Prisma.ApplicationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ApplicationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ApplicationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApplicationPayload>
          }
          aggregate: {
            args: Prisma.ApplicationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateApplication>
          }
          groupBy: {
            args: Prisma.ApplicationGroupByArgs<ExtArgs>
            result: $Utils.Optional<ApplicationGroupByOutputType>[]
          }
          count: {
            args: Prisma.ApplicationCountArgs<ExtArgs>
            result: $Utils.Optional<ApplicationCountAggregateOutputType> | number
          }
        }
      }
      TextToSpeech: {
        payload: Prisma.$TextToSpeechPayload<ExtArgs>
        fields: Prisma.TextToSpeechFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TextToSpeechFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TextToSpeechPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TextToSpeechFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TextToSpeechPayload>
          }
          findFirst: {
            args: Prisma.TextToSpeechFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TextToSpeechPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TextToSpeechFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TextToSpeechPayload>
          }
          findMany: {
            args: Prisma.TextToSpeechFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TextToSpeechPayload>[]
          }
          create: {
            args: Prisma.TextToSpeechCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TextToSpeechPayload>
          }
          createMany: {
            args: Prisma.TextToSpeechCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TextToSpeechCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TextToSpeechPayload>[]
          }
          delete: {
            args: Prisma.TextToSpeechDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TextToSpeechPayload>
          }
          update: {
            args: Prisma.TextToSpeechUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TextToSpeechPayload>
          }
          deleteMany: {
            args: Prisma.TextToSpeechDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TextToSpeechUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TextToSpeechUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TextToSpeechPayload>
          }
          aggregate: {
            args: Prisma.TextToSpeechAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTextToSpeech>
          }
          groupBy: {
            args: Prisma.TextToSpeechGroupByArgs<ExtArgs>
            result: $Utils.Optional<TextToSpeechGroupByOutputType>[]
          }
          count: {
            args: Prisma.TextToSpeechCountArgs<ExtArgs>
            result: $Utils.Optional<TextToSpeechCountAggregateOutputType> | number
          }
        }
      }
      SpeechToText: {
        payload: Prisma.$SpeechToTextPayload<ExtArgs>
        fields: Prisma.SpeechToTextFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SpeechToTextFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpeechToTextPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SpeechToTextFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpeechToTextPayload>
          }
          findFirst: {
            args: Prisma.SpeechToTextFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpeechToTextPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SpeechToTextFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpeechToTextPayload>
          }
          findMany: {
            args: Prisma.SpeechToTextFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpeechToTextPayload>[]
          }
          create: {
            args: Prisma.SpeechToTextCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpeechToTextPayload>
          }
          createMany: {
            args: Prisma.SpeechToTextCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SpeechToTextCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpeechToTextPayload>[]
          }
          delete: {
            args: Prisma.SpeechToTextDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpeechToTextPayload>
          }
          update: {
            args: Prisma.SpeechToTextUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpeechToTextPayload>
          }
          deleteMany: {
            args: Prisma.SpeechToTextDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SpeechToTextUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SpeechToTextUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpeechToTextPayload>
          }
          aggregate: {
            args: Prisma.SpeechToTextAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSpeechToText>
          }
          groupBy: {
            args: Prisma.SpeechToTextGroupByArgs<ExtArgs>
            result: $Utils.Optional<SpeechToTextGroupByOutputType>[]
          }
          count: {
            args: Prisma.SpeechToTextCountArgs<ExtArgs>
            result: $Utils.Optional<SpeechToTextCountAggregateOutputType> | number
          }
        }
      }
      Intelligence: {
        payload: Prisma.$IntelligencePayload<ExtArgs>
        fields: Prisma.IntelligenceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.IntelligenceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntelligencePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.IntelligenceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntelligencePayload>
          }
          findFirst: {
            args: Prisma.IntelligenceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntelligencePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.IntelligenceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntelligencePayload>
          }
          findMany: {
            args: Prisma.IntelligenceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntelligencePayload>[]
          }
          create: {
            args: Prisma.IntelligenceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntelligencePayload>
          }
          createMany: {
            args: Prisma.IntelligenceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.IntelligenceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntelligencePayload>[]
          }
          delete: {
            args: Prisma.IntelligenceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntelligencePayload>
          }
          update: {
            args: Prisma.IntelligenceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntelligencePayload>
          }
          deleteMany: {
            args: Prisma.IntelligenceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.IntelligenceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.IntelligenceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntelligencePayload>
          }
          aggregate: {
            args: Prisma.IntelligenceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateIntelligence>
          }
          groupBy: {
            args: Prisma.IntelligenceGroupByArgs<ExtArgs>
            result: $Utils.Optional<IntelligenceGroupByOutputType>[]
          }
          count: {
            args: Prisma.IntelligenceCountArgs<ExtArgs>
            result: $Utils.Optional<IntelligenceCountAggregateOutputType> | number
          }
        }
      }
      Product: {
        payload: Prisma.$ProductPayload<ExtArgs>
        fields: Prisma.ProductFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProductFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProductFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          findFirst: {
            args: Prisma.ProductFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProductFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          findMany: {
            args: Prisma.ProductFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>[]
          }
          create: {
            args: Prisma.ProductCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          createMany: {
            args: Prisma.ProductCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProductCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>[]
          }
          delete: {
            args: Prisma.ProductDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          update: {
            args: Prisma.ProductUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          deleteMany: {
            args: Prisma.ProductDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProductUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ProductUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          aggregate: {
            args: Prisma.ProductAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProduct>
          }
          groupBy: {
            args: Prisma.ProductGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProductGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProductCountArgs<ExtArgs>
            result: $Utils.Optional<ProductCountAggregateOutputType> | number
          }
        }
      }
      Secret: {
        payload: Prisma.$SecretPayload<ExtArgs>
        fields: Prisma.SecretFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SecretFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SecretFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretPayload>
          }
          findFirst: {
            args: Prisma.SecretFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SecretFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretPayload>
          }
          findMany: {
            args: Prisma.SecretFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretPayload>[]
          }
          create: {
            args: Prisma.SecretCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretPayload>
          }
          createMany: {
            args: Prisma.SecretCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SecretCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretPayload>[]
          }
          delete: {
            args: Prisma.SecretDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretPayload>
          }
          update: {
            args: Prisma.SecretUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretPayload>
          }
          deleteMany: {
            args: Prisma.SecretDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SecretUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SecretUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretPayload>
          }
          aggregate: {
            args: Prisma.SecretAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSecret>
          }
          groupBy: {
            args: Prisma.SecretGroupByArgs<ExtArgs>
            result: $Utils.Optional<SecretGroupByOutputType>[]
          }
          count: {
            args: Prisma.SecretCountArgs<ExtArgs>
            result: $Utils.Optional<SecretCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ProductCountOutputType
   */

  export type ProductCountOutputType = {
    speechToText: number
    sextToSpeech: number
    intelligence: number
  }

  export type ProductCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    speechToText?: boolean | ProductCountOutputTypeCountSpeechToTextArgs
    sextToSpeech?: boolean | ProductCountOutputTypeCountSextToSpeechArgs
    intelligence?: boolean | ProductCountOutputTypeCountIntelligenceArgs
  }

  // Custom InputTypes
  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductCountOutputType
     */
    select?: ProductCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeCountSpeechToTextArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpeechToTextWhereInput
  }

  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeCountSextToSpeechArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TextToSpeechWhereInput
  }

  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeCountIntelligenceArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IntelligenceWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Application
   */

  export type AggregateApplication = {
    _count: ApplicationCountAggregateOutputType | null
    _min: ApplicationMinAggregateOutputType | null
    _max: ApplicationMaxAggregateOutputType | null
  }

  export type ApplicationMinAggregateOutputType = {
    ref: string | null
    accessKeyId: string | null
    name: string | null
    type: $Enums.ApplicationType | null
    endpoint: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ApplicationMaxAggregateOutputType = {
    ref: string | null
    accessKeyId: string | null
    name: string | null
    type: $Enums.ApplicationType | null
    endpoint: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ApplicationCountAggregateOutputType = {
    ref: number
    accessKeyId: number
    name: number
    type: number
    endpoint: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ApplicationMinAggregateInputType = {
    ref?: true
    accessKeyId?: true
    name?: true
    type?: true
    endpoint?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ApplicationMaxAggregateInputType = {
    ref?: true
    accessKeyId?: true
    name?: true
    type?: true
    endpoint?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ApplicationCountAggregateInputType = {
    ref?: true
    accessKeyId?: true
    name?: true
    type?: true
    endpoint?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ApplicationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Application to aggregate.
     */
    where?: ApplicationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Applications to fetch.
     */
    orderBy?: ApplicationOrderByWithRelationInput | ApplicationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ApplicationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Applications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Applications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Applications
    **/
    _count?: true | ApplicationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ApplicationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ApplicationMaxAggregateInputType
  }

  export type GetApplicationAggregateType<T extends ApplicationAggregateArgs> = {
        [P in keyof T & keyof AggregateApplication]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateApplication[P]>
      : GetScalarType<T[P], AggregateApplication[P]>
  }




  export type ApplicationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ApplicationWhereInput
    orderBy?: ApplicationOrderByWithAggregationInput | ApplicationOrderByWithAggregationInput[]
    by: ApplicationScalarFieldEnum[] | ApplicationScalarFieldEnum
    having?: ApplicationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ApplicationCountAggregateInputType | true
    _min?: ApplicationMinAggregateInputType
    _max?: ApplicationMaxAggregateInputType
  }

  export type ApplicationGroupByOutputType = {
    ref: string
    accessKeyId: string
    name: string
    type: $Enums.ApplicationType
    endpoint: string
    createdAt: Date
    updatedAt: Date
    _count: ApplicationCountAggregateOutputType | null
    _min: ApplicationMinAggregateOutputType | null
    _max: ApplicationMaxAggregateOutputType | null
  }

  type GetApplicationGroupByPayload<T extends ApplicationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ApplicationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ApplicationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ApplicationGroupByOutputType[P]>
            : GetScalarType<T[P], ApplicationGroupByOutputType[P]>
        }
      >
    >


  export type ApplicationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    ref?: boolean
    accessKeyId?: boolean
    name?: boolean
    type?: boolean
    endpoint?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    textToSpeech?: boolean | Application$textToSpeechArgs<ExtArgs>
    speechToText?: boolean | Application$speechToTextArgs<ExtArgs>
    intelligence?: boolean | Application$intelligenceArgs<ExtArgs>
  }, ExtArgs["result"]["application"]>

  export type ApplicationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    ref?: boolean
    accessKeyId?: boolean
    name?: boolean
    type?: boolean
    endpoint?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["application"]>

  export type ApplicationSelectScalar = {
    ref?: boolean
    accessKeyId?: boolean
    name?: boolean
    type?: boolean
    endpoint?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ApplicationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    textToSpeech?: boolean | Application$textToSpeechArgs<ExtArgs>
    speechToText?: boolean | Application$speechToTextArgs<ExtArgs>
    intelligence?: boolean | Application$intelligenceArgs<ExtArgs>
  }
  export type ApplicationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ApplicationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Application"
    objects: {
      textToSpeech: Prisma.$TextToSpeechPayload<ExtArgs> | null
      speechToText: Prisma.$SpeechToTextPayload<ExtArgs> | null
      intelligence: Prisma.$IntelligencePayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      ref: string
      accessKeyId: string
      name: string
      type: $Enums.ApplicationType
      endpoint: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["application"]>
    composites: {}
  }

  type ApplicationGetPayload<S extends boolean | null | undefined | ApplicationDefaultArgs> = $Result.GetResult<Prisma.$ApplicationPayload, S>

  type ApplicationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ApplicationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ApplicationCountAggregateInputType | true
    }

  export interface ApplicationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Application'], meta: { name: 'Application' } }
    /**
     * Find zero or one Application that matches the filter.
     * @param {ApplicationFindUniqueArgs} args - Arguments to find a Application
     * @example
     * // Get one Application
     * const application = await prisma.application.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ApplicationFindUniqueArgs>(args: SelectSubset<T, ApplicationFindUniqueArgs<ExtArgs>>): Prisma__ApplicationClient<$Result.GetResult<Prisma.$ApplicationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Application that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ApplicationFindUniqueOrThrowArgs} args - Arguments to find a Application
     * @example
     * // Get one Application
     * const application = await prisma.application.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ApplicationFindUniqueOrThrowArgs>(args: SelectSubset<T, ApplicationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ApplicationClient<$Result.GetResult<Prisma.$ApplicationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Application that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApplicationFindFirstArgs} args - Arguments to find a Application
     * @example
     * // Get one Application
     * const application = await prisma.application.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ApplicationFindFirstArgs>(args?: SelectSubset<T, ApplicationFindFirstArgs<ExtArgs>>): Prisma__ApplicationClient<$Result.GetResult<Prisma.$ApplicationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Application that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApplicationFindFirstOrThrowArgs} args - Arguments to find a Application
     * @example
     * // Get one Application
     * const application = await prisma.application.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ApplicationFindFirstOrThrowArgs>(args?: SelectSubset<T, ApplicationFindFirstOrThrowArgs<ExtArgs>>): Prisma__ApplicationClient<$Result.GetResult<Prisma.$ApplicationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Applications that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApplicationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Applications
     * const applications = await prisma.application.findMany()
     * 
     * // Get first 10 Applications
     * const applications = await prisma.application.findMany({ take: 10 })
     * 
     * // Only select the `ref`
     * const applicationWithRefOnly = await prisma.application.findMany({ select: { ref: true } })
     * 
     */
    findMany<T extends ApplicationFindManyArgs>(args?: SelectSubset<T, ApplicationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ApplicationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Application.
     * @param {ApplicationCreateArgs} args - Arguments to create a Application.
     * @example
     * // Create one Application
     * const Application = await prisma.application.create({
     *   data: {
     *     // ... data to create a Application
     *   }
     * })
     * 
     */
    create<T extends ApplicationCreateArgs>(args: SelectSubset<T, ApplicationCreateArgs<ExtArgs>>): Prisma__ApplicationClient<$Result.GetResult<Prisma.$ApplicationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Applications.
     * @param {ApplicationCreateManyArgs} args - Arguments to create many Applications.
     * @example
     * // Create many Applications
     * const application = await prisma.application.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ApplicationCreateManyArgs>(args?: SelectSubset<T, ApplicationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Applications and returns the data saved in the database.
     * @param {ApplicationCreateManyAndReturnArgs} args - Arguments to create many Applications.
     * @example
     * // Create many Applications
     * const application = await prisma.application.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Applications and only return the `ref`
     * const applicationWithRefOnly = await prisma.application.createManyAndReturn({ 
     *   select: { ref: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ApplicationCreateManyAndReturnArgs>(args?: SelectSubset<T, ApplicationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ApplicationPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Application.
     * @param {ApplicationDeleteArgs} args - Arguments to delete one Application.
     * @example
     * // Delete one Application
     * const Application = await prisma.application.delete({
     *   where: {
     *     // ... filter to delete one Application
     *   }
     * })
     * 
     */
    delete<T extends ApplicationDeleteArgs>(args: SelectSubset<T, ApplicationDeleteArgs<ExtArgs>>): Prisma__ApplicationClient<$Result.GetResult<Prisma.$ApplicationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Application.
     * @param {ApplicationUpdateArgs} args - Arguments to update one Application.
     * @example
     * // Update one Application
     * const application = await prisma.application.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ApplicationUpdateArgs>(args: SelectSubset<T, ApplicationUpdateArgs<ExtArgs>>): Prisma__ApplicationClient<$Result.GetResult<Prisma.$ApplicationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Applications.
     * @param {ApplicationDeleteManyArgs} args - Arguments to filter Applications to delete.
     * @example
     * // Delete a few Applications
     * const { count } = await prisma.application.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ApplicationDeleteManyArgs>(args?: SelectSubset<T, ApplicationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Applications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApplicationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Applications
     * const application = await prisma.application.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ApplicationUpdateManyArgs>(args: SelectSubset<T, ApplicationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Application.
     * @param {ApplicationUpsertArgs} args - Arguments to update or create a Application.
     * @example
     * // Update or create a Application
     * const application = await prisma.application.upsert({
     *   create: {
     *     // ... data to create a Application
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Application we want to update
     *   }
     * })
     */
    upsert<T extends ApplicationUpsertArgs>(args: SelectSubset<T, ApplicationUpsertArgs<ExtArgs>>): Prisma__ApplicationClient<$Result.GetResult<Prisma.$ApplicationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Applications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApplicationCountArgs} args - Arguments to filter Applications to count.
     * @example
     * // Count the number of Applications
     * const count = await prisma.application.count({
     *   where: {
     *     // ... the filter for the Applications we want to count
     *   }
     * })
    **/
    count<T extends ApplicationCountArgs>(
      args?: Subset<T, ApplicationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ApplicationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Application.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApplicationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ApplicationAggregateArgs>(args: Subset<T, ApplicationAggregateArgs>): Prisma.PrismaPromise<GetApplicationAggregateType<T>>

    /**
     * Group by Application.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApplicationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ApplicationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ApplicationGroupByArgs['orderBy'] }
        : { orderBy?: ApplicationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ApplicationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetApplicationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Application model
   */
  readonly fields: ApplicationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Application.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ApplicationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    textToSpeech<T extends Application$textToSpeechArgs<ExtArgs> = {}>(args?: Subset<T, Application$textToSpeechArgs<ExtArgs>>): Prisma__TextToSpeechClient<$Result.GetResult<Prisma.$TextToSpeechPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    speechToText<T extends Application$speechToTextArgs<ExtArgs> = {}>(args?: Subset<T, Application$speechToTextArgs<ExtArgs>>): Prisma__SpeechToTextClient<$Result.GetResult<Prisma.$SpeechToTextPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    intelligence<T extends Application$intelligenceArgs<ExtArgs> = {}>(args?: Subset<T, Application$intelligenceArgs<ExtArgs>>): Prisma__IntelligenceClient<$Result.GetResult<Prisma.$IntelligencePayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Application model
   */ 
  interface ApplicationFieldRefs {
    readonly ref: FieldRef<"Application", 'String'>
    readonly accessKeyId: FieldRef<"Application", 'String'>
    readonly name: FieldRef<"Application", 'String'>
    readonly type: FieldRef<"Application", 'ApplicationType'>
    readonly endpoint: FieldRef<"Application", 'String'>
    readonly createdAt: FieldRef<"Application", 'DateTime'>
    readonly updatedAt: FieldRef<"Application", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Application findUnique
   */
  export type ApplicationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Application
     */
    select?: ApplicationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApplicationInclude<ExtArgs> | null
    /**
     * Filter, which Application to fetch.
     */
    where: ApplicationWhereUniqueInput
  }

  /**
   * Application findUniqueOrThrow
   */
  export type ApplicationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Application
     */
    select?: ApplicationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApplicationInclude<ExtArgs> | null
    /**
     * Filter, which Application to fetch.
     */
    where: ApplicationWhereUniqueInput
  }

  /**
   * Application findFirst
   */
  export type ApplicationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Application
     */
    select?: ApplicationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApplicationInclude<ExtArgs> | null
    /**
     * Filter, which Application to fetch.
     */
    where?: ApplicationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Applications to fetch.
     */
    orderBy?: ApplicationOrderByWithRelationInput | ApplicationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Applications.
     */
    cursor?: ApplicationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Applications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Applications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Applications.
     */
    distinct?: ApplicationScalarFieldEnum | ApplicationScalarFieldEnum[]
  }

  /**
   * Application findFirstOrThrow
   */
  export type ApplicationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Application
     */
    select?: ApplicationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApplicationInclude<ExtArgs> | null
    /**
     * Filter, which Application to fetch.
     */
    where?: ApplicationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Applications to fetch.
     */
    orderBy?: ApplicationOrderByWithRelationInput | ApplicationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Applications.
     */
    cursor?: ApplicationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Applications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Applications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Applications.
     */
    distinct?: ApplicationScalarFieldEnum | ApplicationScalarFieldEnum[]
  }

  /**
   * Application findMany
   */
  export type ApplicationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Application
     */
    select?: ApplicationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApplicationInclude<ExtArgs> | null
    /**
     * Filter, which Applications to fetch.
     */
    where?: ApplicationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Applications to fetch.
     */
    orderBy?: ApplicationOrderByWithRelationInput | ApplicationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Applications.
     */
    cursor?: ApplicationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Applications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Applications.
     */
    skip?: number
    distinct?: ApplicationScalarFieldEnum | ApplicationScalarFieldEnum[]
  }

  /**
   * Application create
   */
  export type ApplicationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Application
     */
    select?: ApplicationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApplicationInclude<ExtArgs> | null
    /**
     * The data needed to create a Application.
     */
    data: XOR<ApplicationCreateInput, ApplicationUncheckedCreateInput>
  }

  /**
   * Application createMany
   */
  export type ApplicationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Applications.
     */
    data: ApplicationCreateManyInput | ApplicationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Application createManyAndReturn
   */
  export type ApplicationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Application
     */
    select?: ApplicationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Applications.
     */
    data: ApplicationCreateManyInput | ApplicationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Application update
   */
  export type ApplicationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Application
     */
    select?: ApplicationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApplicationInclude<ExtArgs> | null
    /**
     * The data needed to update a Application.
     */
    data: XOR<ApplicationUpdateInput, ApplicationUncheckedUpdateInput>
    /**
     * Choose, which Application to update.
     */
    where: ApplicationWhereUniqueInput
  }

  /**
   * Application updateMany
   */
  export type ApplicationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Applications.
     */
    data: XOR<ApplicationUpdateManyMutationInput, ApplicationUncheckedUpdateManyInput>
    /**
     * Filter which Applications to update
     */
    where?: ApplicationWhereInput
  }

  /**
   * Application upsert
   */
  export type ApplicationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Application
     */
    select?: ApplicationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApplicationInclude<ExtArgs> | null
    /**
     * The filter to search for the Application to update in case it exists.
     */
    where: ApplicationWhereUniqueInput
    /**
     * In case the Application found by the `where` argument doesn't exist, create a new Application with this data.
     */
    create: XOR<ApplicationCreateInput, ApplicationUncheckedCreateInput>
    /**
     * In case the Application was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ApplicationUpdateInput, ApplicationUncheckedUpdateInput>
  }

  /**
   * Application delete
   */
  export type ApplicationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Application
     */
    select?: ApplicationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApplicationInclude<ExtArgs> | null
    /**
     * Filter which Application to delete.
     */
    where: ApplicationWhereUniqueInput
  }

  /**
   * Application deleteMany
   */
  export type ApplicationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Applications to delete
     */
    where?: ApplicationWhereInput
  }

  /**
   * Application.textToSpeech
   */
  export type Application$textToSpeechArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TextToSpeech
     */
    select?: TextToSpeechSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TextToSpeechInclude<ExtArgs> | null
    where?: TextToSpeechWhereInput
  }

  /**
   * Application.speechToText
   */
  export type Application$speechToTextArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpeechToText
     */
    select?: SpeechToTextSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpeechToTextInclude<ExtArgs> | null
    where?: SpeechToTextWhereInput
  }

  /**
   * Application.intelligence
   */
  export type Application$intelligenceArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Intelligence
     */
    select?: IntelligenceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntelligenceInclude<ExtArgs> | null
    where?: IntelligenceWhereInput
  }

  /**
   * Application without action
   */
  export type ApplicationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Application
     */
    select?: ApplicationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApplicationInclude<ExtArgs> | null
  }


  /**
   * Model TextToSpeech
   */

  export type AggregateTextToSpeech = {
    _count: TextToSpeechCountAggregateOutputType | null
    _min: TextToSpeechMinAggregateOutputType | null
    _max: TextToSpeechMaxAggregateOutputType | null
  }

  export type TextToSpeechMinAggregateOutputType = {
    ref: string | null
    applicationRef: string | null
    productRef: string | null
  }

  export type TextToSpeechMaxAggregateOutputType = {
    ref: string | null
    applicationRef: string | null
    productRef: string | null
  }

  export type TextToSpeechCountAggregateOutputType = {
    ref: number
    config: number
    applicationRef: number
    productRef: number
    _all: number
  }


  export type TextToSpeechMinAggregateInputType = {
    ref?: true
    applicationRef?: true
    productRef?: true
  }

  export type TextToSpeechMaxAggregateInputType = {
    ref?: true
    applicationRef?: true
    productRef?: true
  }

  export type TextToSpeechCountAggregateInputType = {
    ref?: true
    config?: true
    applicationRef?: true
    productRef?: true
    _all?: true
  }

  export type TextToSpeechAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TextToSpeech to aggregate.
     */
    where?: TextToSpeechWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TextToSpeeches to fetch.
     */
    orderBy?: TextToSpeechOrderByWithRelationInput | TextToSpeechOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TextToSpeechWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TextToSpeeches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TextToSpeeches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TextToSpeeches
    **/
    _count?: true | TextToSpeechCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TextToSpeechMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TextToSpeechMaxAggregateInputType
  }

  export type GetTextToSpeechAggregateType<T extends TextToSpeechAggregateArgs> = {
        [P in keyof T & keyof AggregateTextToSpeech]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTextToSpeech[P]>
      : GetScalarType<T[P], AggregateTextToSpeech[P]>
  }




  export type TextToSpeechGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TextToSpeechWhereInput
    orderBy?: TextToSpeechOrderByWithAggregationInput | TextToSpeechOrderByWithAggregationInput[]
    by: TextToSpeechScalarFieldEnum[] | TextToSpeechScalarFieldEnum
    having?: TextToSpeechScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TextToSpeechCountAggregateInputType | true
    _min?: TextToSpeechMinAggregateInputType
    _max?: TextToSpeechMaxAggregateInputType
  }

  export type TextToSpeechGroupByOutputType = {
    ref: string
    config: JsonValue
    applicationRef: string
    productRef: string
    _count: TextToSpeechCountAggregateOutputType | null
    _min: TextToSpeechMinAggregateOutputType | null
    _max: TextToSpeechMaxAggregateOutputType | null
  }

  type GetTextToSpeechGroupByPayload<T extends TextToSpeechGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TextToSpeechGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TextToSpeechGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TextToSpeechGroupByOutputType[P]>
            : GetScalarType<T[P], TextToSpeechGroupByOutputType[P]>
        }
      >
    >


  export type TextToSpeechSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    ref?: boolean
    config?: boolean
    applicationRef?: boolean
    productRef?: boolean
    application?: boolean | ApplicationDefaultArgs<ExtArgs>
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["textToSpeech"]>

  export type TextToSpeechSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    ref?: boolean
    config?: boolean
    applicationRef?: boolean
    productRef?: boolean
    application?: boolean | ApplicationDefaultArgs<ExtArgs>
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["textToSpeech"]>

  export type TextToSpeechSelectScalar = {
    ref?: boolean
    config?: boolean
    applicationRef?: boolean
    productRef?: boolean
  }

  export type TextToSpeechInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    application?: boolean | ApplicationDefaultArgs<ExtArgs>
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }
  export type TextToSpeechIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    application?: boolean | ApplicationDefaultArgs<ExtArgs>
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }

  export type $TextToSpeechPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TextToSpeech"
    objects: {
      application: Prisma.$ApplicationPayload<ExtArgs>
      product: Prisma.$ProductPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      ref: string
      config: Prisma.JsonValue
      applicationRef: string
      productRef: string
    }, ExtArgs["result"]["textToSpeech"]>
    composites: {}
  }

  type TextToSpeechGetPayload<S extends boolean | null | undefined | TextToSpeechDefaultArgs> = $Result.GetResult<Prisma.$TextToSpeechPayload, S>

  type TextToSpeechCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TextToSpeechFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TextToSpeechCountAggregateInputType | true
    }

  export interface TextToSpeechDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TextToSpeech'], meta: { name: 'TextToSpeech' } }
    /**
     * Find zero or one TextToSpeech that matches the filter.
     * @param {TextToSpeechFindUniqueArgs} args - Arguments to find a TextToSpeech
     * @example
     * // Get one TextToSpeech
     * const textToSpeech = await prisma.textToSpeech.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TextToSpeechFindUniqueArgs>(args: SelectSubset<T, TextToSpeechFindUniqueArgs<ExtArgs>>): Prisma__TextToSpeechClient<$Result.GetResult<Prisma.$TextToSpeechPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TextToSpeech that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TextToSpeechFindUniqueOrThrowArgs} args - Arguments to find a TextToSpeech
     * @example
     * // Get one TextToSpeech
     * const textToSpeech = await prisma.textToSpeech.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TextToSpeechFindUniqueOrThrowArgs>(args: SelectSubset<T, TextToSpeechFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TextToSpeechClient<$Result.GetResult<Prisma.$TextToSpeechPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TextToSpeech that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TextToSpeechFindFirstArgs} args - Arguments to find a TextToSpeech
     * @example
     * // Get one TextToSpeech
     * const textToSpeech = await prisma.textToSpeech.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TextToSpeechFindFirstArgs>(args?: SelectSubset<T, TextToSpeechFindFirstArgs<ExtArgs>>): Prisma__TextToSpeechClient<$Result.GetResult<Prisma.$TextToSpeechPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TextToSpeech that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TextToSpeechFindFirstOrThrowArgs} args - Arguments to find a TextToSpeech
     * @example
     * // Get one TextToSpeech
     * const textToSpeech = await prisma.textToSpeech.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TextToSpeechFindFirstOrThrowArgs>(args?: SelectSubset<T, TextToSpeechFindFirstOrThrowArgs<ExtArgs>>): Prisma__TextToSpeechClient<$Result.GetResult<Prisma.$TextToSpeechPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TextToSpeeches that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TextToSpeechFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TextToSpeeches
     * const textToSpeeches = await prisma.textToSpeech.findMany()
     * 
     * // Get first 10 TextToSpeeches
     * const textToSpeeches = await prisma.textToSpeech.findMany({ take: 10 })
     * 
     * // Only select the `ref`
     * const textToSpeechWithRefOnly = await prisma.textToSpeech.findMany({ select: { ref: true } })
     * 
     */
    findMany<T extends TextToSpeechFindManyArgs>(args?: SelectSubset<T, TextToSpeechFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TextToSpeechPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TextToSpeech.
     * @param {TextToSpeechCreateArgs} args - Arguments to create a TextToSpeech.
     * @example
     * // Create one TextToSpeech
     * const TextToSpeech = await prisma.textToSpeech.create({
     *   data: {
     *     // ... data to create a TextToSpeech
     *   }
     * })
     * 
     */
    create<T extends TextToSpeechCreateArgs>(args: SelectSubset<T, TextToSpeechCreateArgs<ExtArgs>>): Prisma__TextToSpeechClient<$Result.GetResult<Prisma.$TextToSpeechPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TextToSpeeches.
     * @param {TextToSpeechCreateManyArgs} args - Arguments to create many TextToSpeeches.
     * @example
     * // Create many TextToSpeeches
     * const textToSpeech = await prisma.textToSpeech.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TextToSpeechCreateManyArgs>(args?: SelectSubset<T, TextToSpeechCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TextToSpeeches and returns the data saved in the database.
     * @param {TextToSpeechCreateManyAndReturnArgs} args - Arguments to create many TextToSpeeches.
     * @example
     * // Create many TextToSpeeches
     * const textToSpeech = await prisma.textToSpeech.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TextToSpeeches and only return the `ref`
     * const textToSpeechWithRefOnly = await prisma.textToSpeech.createManyAndReturn({ 
     *   select: { ref: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TextToSpeechCreateManyAndReturnArgs>(args?: SelectSubset<T, TextToSpeechCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TextToSpeechPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TextToSpeech.
     * @param {TextToSpeechDeleteArgs} args - Arguments to delete one TextToSpeech.
     * @example
     * // Delete one TextToSpeech
     * const TextToSpeech = await prisma.textToSpeech.delete({
     *   where: {
     *     // ... filter to delete one TextToSpeech
     *   }
     * })
     * 
     */
    delete<T extends TextToSpeechDeleteArgs>(args: SelectSubset<T, TextToSpeechDeleteArgs<ExtArgs>>): Prisma__TextToSpeechClient<$Result.GetResult<Prisma.$TextToSpeechPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TextToSpeech.
     * @param {TextToSpeechUpdateArgs} args - Arguments to update one TextToSpeech.
     * @example
     * // Update one TextToSpeech
     * const textToSpeech = await prisma.textToSpeech.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TextToSpeechUpdateArgs>(args: SelectSubset<T, TextToSpeechUpdateArgs<ExtArgs>>): Prisma__TextToSpeechClient<$Result.GetResult<Prisma.$TextToSpeechPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TextToSpeeches.
     * @param {TextToSpeechDeleteManyArgs} args - Arguments to filter TextToSpeeches to delete.
     * @example
     * // Delete a few TextToSpeeches
     * const { count } = await prisma.textToSpeech.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TextToSpeechDeleteManyArgs>(args?: SelectSubset<T, TextToSpeechDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TextToSpeeches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TextToSpeechUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TextToSpeeches
     * const textToSpeech = await prisma.textToSpeech.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TextToSpeechUpdateManyArgs>(args: SelectSubset<T, TextToSpeechUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TextToSpeech.
     * @param {TextToSpeechUpsertArgs} args - Arguments to update or create a TextToSpeech.
     * @example
     * // Update or create a TextToSpeech
     * const textToSpeech = await prisma.textToSpeech.upsert({
     *   create: {
     *     // ... data to create a TextToSpeech
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TextToSpeech we want to update
     *   }
     * })
     */
    upsert<T extends TextToSpeechUpsertArgs>(args: SelectSubset<T, TextToSpeechUpsertArgs<ExtArgs>>): Prisma__TextToSpeechClient<$Result.GetResult<Prisma.$TextToSpeechPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TextToSpeeches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TextToSpeechCountArgs} args - Arguments to filter TextToSpeeches to count.
     * @example
     * // Count the number of TextToSpeeches
     * const count = await prisma.textToSpeech.count({
     *   where: {
     *     // ... the filter for the TextToSpeeches we want to count
     *   }
     * })
    **/
    count<T extends TextToSpeechCountArgs>(
      args?: Subset<T, TextToSpeechCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TextToSpeechCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TextToSpeech.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TextToSpeechAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TextToSpeechAggregateArgs>(args: Subset<T, TextToSpeechAggregateArgs>): Prisma.PrismaPromise<GetTextToSpeechAggregateType<T>>

    /**
     * Group by TextToSpeech.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TextToSpeechGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TextToSpeechGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TextToSpeechGroupByArgs['orderBy'] }
        : { orderBy?: TextToSpeechGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TextToSpeechGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTextToSpeechGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TextToSpeech model
   */
  readonly fields: TextToSpeechFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TextToSpeech.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TextToSpeechClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    application<T extends ApplicationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ApplicationDefaultArgs<ExtArgs>>): Prisma__ApplicationClient<$Result.GetResult<Prisma.$ApplicationPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    product<T extends ProductDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProductDefaultArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TextToSpeech model
   */ 
  interface TextToSpeechFieldRefs {
    readonly ref: FieldRef<"TextToSpeech", 'String'>
    readonly config: FieldRef<"TextToSpeech", 'Json'>
    readonly applicationRef: FieldRef<"TextToSpeech", 'String'>
    readonly productRef: FieldRef<"TextToSpeech", 'String'>
  }
    

  // Custom InputTypes
  /**
   * TextToSpeech findUnique
   */
  export type TextToSpeechFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TextToSpeech
     */
    select?: TextToSpeechSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TextToSpeechInclude<ExtArgs> | null
    /**
     * Filter, which TextToSpeech to fetch.
     */
    where: TextToSpeechWhereUniqueInput
  }

  /**
   * TextToSpeech findUniqueOrThrow
   */
  export type TextToSpeechFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TextToSpeech
     */
    select?: TextToSpeechSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TextToSpeechInclude<ExtArgs> | null
    /**
     * Filter, which TextToSpeech to fetch.
     */
    where: TextToSpeechWhereUniqueInput
  }

  /**
   * TextToSpeech findFirst
   */
  export type TextToSpeechFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TextToSpeech
     */
    select?: TextToSpeechSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TextToSpeechInclude<ExtArgs> | null
    /**
     * Filter, which TextToSpeech to fetch.
     */
    where?: TextToSpeechWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TextToSpeeches to fetch.
     */
    orderBy?: TextToSpeechOrderByWithRelationInput | TextToSpeechOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TextToSpeeches.
     */
    cursor?: TextToSpeechWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TextToSpeeches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TextToSpeeches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TextToSpeeches.
     */
    distinct?: TextToSpeechScalarFieldEnum | TextToSpeechScalarFieldEnum[]
  }

  /**
   * TextToSpeech findFirstOrThrow
   */
  export type TextToSpeechFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TextToSpeech
     */
    select?: TextToSpeechSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TextToSpeechInclude<ExtArgs> | null
    /**
     * Filter, which TextToSpeech to fetch.
     */
    where?: TextToSpeechWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TextToSpeeches to fetch.
     */
    orderBy?: TextToSpeechOrderByWithRelationInput | TextToSpeechOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TextToSpeeches.
     */
    cursor?: TextToSpeechWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TextToSpeeches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TextToSpeeches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TextToSpeeches.
     */
    distinct?: TextToSpeechScalarFieldEnum | TextToSpeechScalarFieldEnum[]
  }

  /**
   * TextToSpeech findMany
   */
  export type TextToSpeechFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TextToSpeech
     */
    select?: TextToSpeechSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TextToSpeechInclude<ExtArgs> | null
    /**
     * Filter, which TextToSpeeches to fetch.
     */
    where?: TextToSpeechWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TextToSpeeches to fetch.
     */
    orderBy?: TextToSpeechOrderByWithRelationInput | TextToSpeechOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TextToSpeeches.
     */
    cursor?: TextToSpeechWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TextToSpeeches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TextToSpeeches.
     */
    skip?: number
    distinct?: TextToSpeechScalarFieldEnum | TextToSpeechScalarFieldEnum[]
  }

  /**
   * TextToSpeech create
   */
  export type TextToSpeechCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TextToSpeech
     */
    select?: TextToSpeechSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TextToSpeechInclude<ExtArgs> | null
    /**
     * The data needed to create a TextToSpeech.
     */
    data: XOR<TextToSpeechCreateInput, TextToSpeechUncheckedCreateInput>
  }

  /**
   * TextToSpeech createMany
   */
  export type TextToSpeechCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TextToSpeeches.
     */
    data: TextToSpeechCreateManyInput | TextToSpeechCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TextToSpeech createManyAndReturn
   */
  export type TextToSpeechCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TextToSpeech
     */
    select?: TextToSpeechSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TextToSpeeches.
     */
    data: TextToSpeechCreateManyInput | TextToSpeechCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TextToSpeechIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TextToSpeech update
   */
  export type TextToSpeechUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TextToSpeech
     */
    select?: TextToSpeechSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TextToSpeechInclude<ExtArgs> | null
    /**
     * The data needed to update a TextToSpeech.
     */
    data: XOR<TextToSpeechUpdateInput, TextToSpeechUncheckedUpdateInput>
    /**
     * Choose, which TextToSpeech to update.
     */
    where: TextToSpeechWhereUniqueInput
  }

  /**
   * TextToSpeech updateMany
   */
  export type TextToSpeechUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TextToSpeeches.
     */
    data: XOR<TextToSpeechUpdateManyMutationInput, TextToSpeechUncheckedUpdateManyInput>
    /**
     * Filter which TextToSpeeches to update
     */
    where?: TextToSpeechWhereInput
  }

  /**
   * TextToSpeech upsert
   */
  export type TextToSpeechUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TextToSpeech
     */
    select?: TextToSpeechSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TextToSpeechInclude<ExtArgs> | null
    /**
     * The filter to search for the TextToSpeech to update in case it exists.
     */
    where: TextToSpeechWhereUniqueInput
    /**
     * In case the TextToSpeech found by the `where` argument doesn't exist, create a new TextToSpeech with this data.
     */
    create: XOR<TextToSpeechCreateInput, TextToSpeechUncheckedCreateInput>
    /**
     * In case the TextToSpeech was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TextToSpeechUpdateInput, TextToSpeechUncheckedUpdateInput>
  }

  /**
   * TextToSpeech delete
   */
  export type TextToSpeechDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TextToSpeech
     */
    select?: TextToSpeechSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TextToSpeechInclude<ExtArgs> | null
    /**
     * Filter which TextToSpeech to delete.
     */
    where: TextToSpeechWhereUniqueInput
  }

  /**
   * TextToSpeech deleteMany
   */
  export type TextToSpeechDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TextToSpeeches to delete
     */
    where?: TextToSpeechWhereInput
  }

  /**
   * TextToSpeech without action
   */
  export type TextToSpeechDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TextToSpeech
     */
    select?: TextToSpeechSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TextToSpeechInclude<ExtArgs> | null
  }


  /**
   * Model SpeechToText
   */

  export type AggregateSpeechToText = {
    _count: SpeechToTextCountAggregateOutputType | null
    _min: SpeechToTextMinAggregateOutputType | null
    _max: SpeechToTextMaxAggregateOutputType | null
  }

  export type SpeechToTextMinAggregateOutputType = {
    ref: string | null
    applicationRef: string | null
    productRef: string | null
  }

  export type SpeechToTextMaxAggregateOutputType = {
    ref: string | null
    applicationRef: string | null
    productRef: string | null
  }

  export type SpeechToTextCountAggregateOutputType = {
    ref: number
    config: number
    applicationRef: number
    productRef: number
    _all: number
  }


  export type SpeechToTextMinAggregateInputType = {
    ref?: true
    applicationRef?: true
    productRef?: true
  }

  export type SpeechToTextMaxAggregateInputType = {
    ref?: true
    applicationRef?: true
    productRef?: true
  }

  export type SpeechToTextCountAggregateInputType = {
    ref?: true
    config?: true
    applicationRef?: true
    productRef?: true
    _all?: true
  }

  export type SpeechToTextAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SpeechToText to aggregate.
     */
    where?: SpeechToTextWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SpeechToTexts to fetch.
     */
    orderBy?: SpeechToTextOrderByWithRelationInput | SpeechToTextOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SpeechToTextWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SpeechToTexts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SpeechToTexts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SpeechToTexts
    **/
    _count?: true | SpeechToTextCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SpeechToTextMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SpeechToTextMaxAggregateInputType
  }

  export type GetSpeechToTextAggregateType<T extends SpeechToTextAggregateArgs> = {
        [P in keyof T & keyof AggregateSpeechToText]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSpeechToText[P]>
      : GetScalarType<T[P], AggregateSpeechToText[P]>
  }




  export type SpeechToTextGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpeechToTextWhereInput
    orderBy?: SpeechToTextOrderByWithAggregationInput | SpeechToTextOrderByWithAggregationInput[]
    by: SpeechToTextScalarFieldEnum[] | SpeechToTextScalarFieldEnum
    having?: SpeechToTextScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SpeechToTextCountAggregateInputType | true
    _min?: SpeechToTextMinAggregateInputType
    _max?: SpeechToTextMaxAggregateInputType
  }

  export type SpeechToTextGroupByOutputType = {
    ref: string
    config: JsonValue
    applicationRef: string
    productRef: string
    _count: SpeechToTextCountAggregateOutputType | null
    _min: SpeechToTextMinAggregateOutputType | null
    _max: SpeechToTextMaxAggregateOutputType | null
  }

  type GetSpeechToTextGroupByPayload<T extends SpeechToTextGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SpeechToTextGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SpeechToTextGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SpeechToTextGroupByOutputType[P]>
            : GetScalarType<T[P], SpeechToTextGroupByOutputType[P]>
        }
      >
    >


  export type SpeechToTextSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    ref?: boolean
    config?: boolean
    applicationRef?: boolean
    productRef?: boolean
    application?: boolean | ApplicationDefaultArgs<ExtArgs>
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["speechToText"]>

  export type SpeechToTextSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    ref?: boolean
    config?: boolean
    applicationRef?: boolean
    productRef?: boolean
    application?: boolean | ApplicationDefaultArgs<ExtArgs>
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["speechToText"]>

  export type SpeechToTextSelectScalar = {
    ref?: boolean
    config?: boolean
    applicationRef?: boolean
    productRef?: boolean
  }

  export type SpeechToTextInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    application?: boolean | ApplicationDefaultArgs<ExtArgs>
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }
  export type SpeechToTextIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    application?: boolean | ApplicationDefaultArgs<ExtArgs>
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }

  export type $SpeechToTextPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SpeechToText"
    objects: {
      application: Prisma.$ApplicationPayload<ExtArgs>
      product: Prisma.$ProductPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      ref: string
      config: Prisma.JsonValue
      applicationRef: string
      productRef: string
    }, ExtArgs["result"]["speechToText"]>
    composites: {}
  }

  type SpeechToTextGetPayload<S extends boolean | null | undefined | SpeechToTextDefaultArgs> = $Result.GetResult<Prisma.$SpeechToTextPayload, S>

  type SpeechToTextCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SpeechToTextFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SpeechToTextCountAggregateInputType | true
    }

  export interface SpeechToTextDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SpeechToText'], meta: { name: 'SpeechToText' } }
    /**
     * Find zero or one SpeechToText that matches the filter.
     * @param {SpeechToTextFindUniqueArgs} args - Arguments to find a SpeechToText
     * @example
     * // Get one SpeechToText
     * const speechToText = await prisma.speechToText.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SpeechToTextFindUniqueArgs>(args: SelectSubset<T, SpeechToTextFindUniqueArgs<ExtArgs>>): Prisma__SpeechToTextClient<$Result.GetResult<Prisma.$SpeechToTextPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one SpeechToText that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SpeechToTextFindUniqueOrThrowArgs} args - Arguments to find a SpeechToText
     * @example
     * // Get one SpeechToText
     * const speechToText = await prisma.speechToText.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SpeechToTextFindUniqueOrThrowArgs>(args: SelectSubset<T, SpeechToTextFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SpeechToTextClient<$Result.GetResult<Prisma.$SpeechToTextPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first SpeechToText that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpeechToTextFindFirstArgs} args - Arguments to find a SpeechToText
     * @example
     * // Get one SpeechToText
     * const speechToText = await prisma.speechToText.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SpeechToTextFindFirstArgs>(args?: SelectSubset<T, SpeechToTextFindFirstArgs<ExtArgs>>): Prisma__SpeechToTextClient<$Result.GetResult<Prisma.$SpeechToTextPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first SpeechToText that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpeechToTextFindFirstOrThrowArgs} args - Arguments to find a SpeechToText
     * @example
     * // Get one SpeechToText
     * const speechToText = await prisma.speechToText.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SpeechToTextFindFirstOrThrowArgs>(args?: SelectSubset<T, SpeechToTextFindFirstOrThrowArgs<ExtArgs>>): Prisma__SpeechToTextClient<$Result.GetResult<Prisma.$SpeechToTextPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more SpeechToTexts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpeechToTextFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SpeechToTexts
     * const speechToTexts = await prisma.speechToText.findMany()
     * 
     * // Get first 10 SpeechToTexts
     * const speechToTexts = await prisma.speechToText.findMany({ take: 10 })
     * 
     * // Only select the `ref`
     * const speechToTextWithRefOnly = await prisma.speechToText.findMany({ select: { ref: true } })
     * 
     */
    findMany<T extends SpeechToTextFindManyArgs>(args?: SelectSubset<T, SpeechToTextFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpeechToTextPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a SpeechToText.
     * @param {SpeechToTextCreateArgs} args - Arguments to create a SpeechToText.
     * @example
     * // Create one SpeechToText
     * const SpeechToText = await prisma.speechToText.create({
     *   data: {
     *     // ... data to create a SpeechToText
     *   }
     * })
     * 
     */
    create<T extends SpeechToTextCreateArgs>(args: SelectSubset<T, SpeechToTextCreateArgs<ExtArgs>>): Prisma__SpeechToTextClient<$Result.GetResult<Prisma.$SpeechToTextPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many SpeechToTexts.
     * @param {SpeechToTextCreateManyArgs} args - Arguments to create many SpeechToTexts.
     * @example
     * // Create many SpeechToTexts
     * const speechToText = await prisma.speechToText.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SpeechToTextCreateManyArgs>(args?: SelectSubset<T, SpeechToTextCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SpeechToTexts and returns the data saved in the database.
     * @param {SpeechToTextCreateManyAndReturnArgs} args - Arguments to create many SpeechToTexts.
     * @example
     * // Create many SpeechToTexts
     * const speechToText = await prisma.speechToText.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SpeechToTexts and only return the `ref`
     * const speechToTextWithRefOnly = await prisma.speechToText.createManyAndReturn({ 
     *   select: { ref: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SpeechToTextCreateManyAndReturnArgs>(args?: SelectSubset<T, SpeechToTextCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpeechToTextPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a SpeechToText.
     * @param {SpeechToTextDeleteArgs} args - Arguments to delete one SpeechToText.
     * @example
     * // Delete one SpeechToText
     * const SpeechToText = await prisma.speechToText.delete({
     *   where: {
     *     // ... filter to delete one SpeechToText
     *   }
     * })
     * 
     */
    delete<T extends SpeechToTextDeleteArgs>(args: SelectSubset<T, SpeechToTextDeleteArgs<ExtArgs>>): Prisma__SpeechToTextClient<$Result.GetResult<Prisma.$SpeechToTextPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one SpeechToText.
     * @param {SpeechToTextUpdateArgs} args - Arguments to update one SpeechToText.
     * @example
     * // Update one SpeechToText
     * const speechToText = await prisma.speechToText.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SpeechToTextUpdateArgs>(args: SelectSubset<T, SpeechToTextUpdateArgs<ExtArgs>>): Prisma__SpeechToTextClient<$Result.GetResult<Prisma.$SpeechToTextPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more SpeechToTexts.
     * @param {SpeechToTextDeleteManyArgs} args - Arguments to filter SpeechToTexts to delete.
     * @example
     * // Delete a few SpeechToTexts
     * const { count } = await prisma.speechToText.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SpeechToTextDeleteManyArgs>(args?: SelectSubset<T, SpeechToTextDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SpeechToTexts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpeechToTextUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SpeechToTexts
     * const speechToText = await prisma.speechToText.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SpeechToTextUpdateManyArgs>(args: SelectSubset<T, SpeechToTextUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one SpeechToText.
     * @param {SpeechToTextUpsertArgs} args - Arguments to update or create a SpeechToText.
     * @example
     * // Update or create a SpeechToText
     * const speechToText = await prisma.speechToText.upsert({
     *   create: {
     *     // ... data to create a SpeechToText
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SpeechToText we want to update
     *   }
     * })
     */
    upsert<T extends SpeechToTextUpsertArgs>(args: SelectSubset<T, SpeechToTextUpsertArgs<ExtArgs>>): Prisma__SpeechToTextClient<$Result.GetResult<Prisma.$SpeechToTextPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of SpeechToTexts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpeechToTextCountArgs} args - Arguments to filter SpeechToTexts to count.
     * @example
     * // Count the number of SpeechToTexts
     * const count = await prisma.speechToText.count({
     *   where: {
     *     // ... the filter for the SpeechToTexts we want to count
     *   }
     * })
    **/
    count<T extends SpeechToTextCountArgs>(
      args?: Subset<T, SpeechToTextCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SpeechToTextCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SpeechToText.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpeechToTextAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SpeechToTextAggregateArgs>(args: Subset<T, SpeechToTextAggregateArgs>): Prisma.PrismaPromise<GetSpeechToTextAggregateType<T>>

    /**
     * Group by SpeechToText.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpeechToTextGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SpeechToTextGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SpeechToTextGroupByArgs['orderBy'] }
        : { orderBy?: SpeechToTextGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SpeechToTextGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSpeechToTextGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SpeechToText model
   */
  readonly fields: SpeechToTextFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SpeechToText.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SpeechToTextClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    application<T extends ApplicationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ApplicationDefaultArgs<ExtArgs>>): Prisma__ApplicationClient<$Result.GetResult<Prisma.$ApplicationPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    product<T extends ProductDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProductDefaultArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SpeechToText model
   */ 
  interface SpeechToTextFieldRefs {
    readonly ref: FieldRef<"SpeechToText", 'String'>
    readonly config: FieldRef<"SpeechToText", 'Json'>
    readonly applicationRef: FieldRef<"SpeechToText", 'String'>
    readonly productRef: FieldRef<"SpeechToText", 'String'>
  }
    

  // Custom InputTypes
  /**
   * SpeechToText findUnique
   */
  export type SpeechToTextFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpeechToText
     */
    select?: SpeechToTextSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpeechToTextInclude<ExtArgs> | null
    /**
     * Filter, which SpeechToText to fetch.
     */
    where: SpeechToTextWhereUniqueInput
  }

  /**
   * SpeechToText findUniqueOrThrow
   */
  export type SpeechToTextFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpeechToText
     */
    select?: SpeechToTextSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpeechToTextInclude<ExtArgs> | null
    /**
     * Filter, which SpeechToText to fetch.
     */
    where: SpeechToTextWhereUniqueInput
  }

  /**
   * SpeechToText findFirst
   */
  export type SpeechToTextFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpeechToText
     */
    select?: SpeechToTextSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpeechToTextInclude<ExtArgs> | null
    /**
     * Filter, which SpeechToText to fetch.
     */
    where?: SpeechToTextWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SpeechToTexts to fetch.
     */
    orderBy?: SpeechToTextOrderByWithRelationInput | SpeechToTextOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SpeechToTexts.
     */
    cursor?: SpeechToTextWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SpeechToTexts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SpeechToTexts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SpeechToTexts.
     */
    distinct?: SpeechToTextScalarFieldEnum | SpeechToTextScalarFieldEnum[]
  }

  /**
   * SpeechToText findFirstOrThrow
   */
  export type SpeechToTextFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpeechToText
     */
    select?: SpeechToTextSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpeechToTextInclude<ExtArgs> | null
    /**
     * Filter, which SpeechToText to fetch.
     */
    where?: SpeechToTextWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SpeechToTexts to fetch.
     */
    orderBy?: SpeechToTextOrderByWithRelationInput | SpeechToTextOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SpeechToTexts.
     */
    cursor?: SpeechToTextWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SpeechToTexts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SpeechToTexts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SpeechToTexts.
     */
    distinct?: SpeechToTextScalarFieldEnum | SpeechToTextScalarFieldEnum[]
  }

  /**
   * SpeechToText findMany
   */
  export type SpeechToTextFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpeechToText
     */
    select?: SpeechToTextSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpeechToTextInclude<ExtArgs> | null
    /**
     * Filter, which SpeechToTexts to fetch.
     */
    where?: SpeechToTextWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SpeechToTexts to fetch.
     */
    orderBy?: SpeechToTextOrderByWithRelationInput | SpeechToTextOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SpeechToTexts.
     */
    cursor?: SpeechToTextWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SpeechToTexts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SpeechToTexts.
     */
    skip?: number
    distinct?: SpeechToTextScalarFieldEnum | SpeechToTextScalarFieldEnum[]
  }

  /**
   * SpeechToText create
   */
  export type SpeechToTextCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpeechToText
     */
    select?: SpeechToTextSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpeechToTextInclude<ExtArgs> | null
    /**
     * The data needed to create a SpeechToText.
     */
    data: XOR<SpeechToTextCreateInput, SpeechToTextUncheckedCreateInput>
  }

  /**
   * SpeechToText createMany
   */
  export type SpeechToTextCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SpeechToTexts.
     */
    data: SpeechToTextCreateManyInput | SpeechToTextCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SpeechToText createManyAndReturn
   */
  export type SpeechToTextCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpeechToText
     */
    select?: SpeechToTextSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many SpeechToTexts.
     */
    data: SpeechToTextCreateManyInput | SpeechToTextCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpeechToTextIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SpeechToText update
   */
  export type SpeechToTextUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpeechToText
     */
    select?: SpeechToTextSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpeechToTextInclude<ExtArgs> | null
    /**
     * The data needed to update a SpeechToText.
     */
    data: XOR<SpeechToTextUpdateInput, SpeechToTextUncheckedUpdateInput>
    /**
     * Choose, which SpeechToText to update.
     */
    where: SpeechToTextWhereUniqueInput
  }

  /**
   * SpeechToText updateMany
   */
  export type SpeechToTextUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SpeechToTexts.
     */
    data: XOR<SpeechToTextUpdateManyMutationInput, SpeechToTextUncheckedUpdateManyInput>
    /**
     * Filter which SpeechToTexts to update
     */
    where?: SpeechToTextWhereInput
  }

  /**
   * SpeechToText upsert
   */
  export type SpeechToTextUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpeechToText
     */
    select?: SpeechToTextSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpeechToTextInclude<ExtArgs> | null
    /**
     * The filter to search for the SpeechToText to update in case it exists.
     */
    where: SpeechToTextWhereUniqueInput
    /**
     * In case the SpeechToText found by the `where` argument doesn't exist, create a new SpeechToText with this data.
     */
    create: XOR<SpeechToTextCreateInput, SpeechToTextUncheckedCreateInput>
    /**
     * In case the SpeechToText was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SpeechToTextUpdateInput, SpeechToTextUncheckedUpdateInput>
  }

  /**
   * SpeechToText delete
   */
  export type SpeechToTextDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpeechToText
     */
    select?: SpeechToTextSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpeechToTextInclude<ExtArgs> | null
    /**
     * Filter which SpeechToText to delete.
     */
    where: SpeechToTextWhereUniqueInput
  }

  /**
   * SpeechToText deleteMany
   */
  export type SpeechToTextDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SpeechToTexts to delete
     */
    where?: SpeechToTextWhereInput
  }

  /**
   * SpeechToText without action
   */
  export type SpeechToTextDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpeechToText
     */
    select?: SpeechToTextSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpeechToTextInclude<ExtArgs> | null
  }


  /**
   * Model Intelligence
   */

  export type AggregateIntelligence = {
    _count: IntelligenceCountAggregateOutputType | null
    _min: IntelligenceMinAggregateOutputType | null
    _max: IntelligenceMaxAggregateOutputType | null
  }

  export type IntelligenceMinAggregateOutputType = {
    ref: string | null
    credentials: string | null
    applicationRef: string | null
    productRef: string | null
  }

  export type IntelligenceMaxAggregateOutputType = {
    ref: string | null
    credentials: string | null
    applicationRef: string | null
    productRef: string | null
  }

  export type IntelligenceCountAggregateOutputType = {
    ref: number
    config: number
    credentials: number
    applicationRef: number
    productRef: number
    _all: number
  }


  export type IntelligenceMinAggregateInputType = {
    ref?: true
    credentials?: true
    applicationRef?: true
    productRef?: true
  }

  export type IntelligenceMaxAggregateInputType = {
    ref?: true
    credentials?: true
    applicationRef?: true
    productRef?: true
  }

  export type IntelligenceCountAggregateInputType = {
    ref?: true
    config?: true
    credentials?: true
    applicationRef?: true
    productRef?: true
    _all?: true
  }

  export type IntelligenceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Intelligence to aggregate.
     */
    where?: IntelligenceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Intelligences to fetch.
     */
    orderBy?: IntelligenceOrderByWithRelationInput | IntelligenceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: IntelligenceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Intelligences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Intelligences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Intelligences
    **/
    _count?: true | IntelligenceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: IntelligenceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: IntelligenceMaxAggregateInputType
  }

  export type GetIntelligenceAggregateType<T extends IntelligenceAggregateArgs> = {
        [P in keyof T & keyof AggregateIntelligence]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateIntelligence[P]>
      : GetScalarType<T[P], AggregateIntelligence[P]>
  }




  export type IntelligenceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IntelligenceWhereInput
    orderBy?: IntelligenceOrderByWithAggregationInput | IntelligenceOrderByWithAggregationInput[]
    by: IntelligenceScalarFieldEnum[] | IntelligenceScalarFieldEnum
    having?: IntelligenceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: IntelligenceCountAggregateInputType | true
    _min?: IntelligenceMinAggregateInputType
    _max?: IntelligenceMaxAggregateInputType
  }

  export type IntelligenceGroupByOutputType = {
    ref: string
    config: JsonValue
    credentials: string
    applicationRef: string
    productRef: string
    _count: IntelligenceCountAggregateOutputType | null
    _min: IntelligenceMinAggregateOutputType | null
    _max: IntelligenceMaxAggregateOutputType | null
  }

  type GetIntelligenceGroupByPayload<T extends IntelligenceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<IntelligenceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof IntelligenceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], IntelligenceGroupByOutputType[P]>
            : GetScalarType<T[P], IntelligenceGroupByOutputType[P]>
        }
      >
    >


  export type IntelligenceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    ref?: boolean
    config?: boolean
    credentials?: boolean
    applicationRef?: boolean
    productRef?: boolean
    application?: boolean | ApplicationDefaultArgs<ExtArgs>
    Product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["intelligence"]>

  export type IntelligenceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    ref?: boolean
    config?: boolean
    credentials?: boolean
    applicationRef?: boolean
    productRef?: boolean
    application?: boolean | ApplicationDefaultArgs<ExtArgs>
    Product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["intelligence"]>

  export type IntelligenceSelectScalar = {
    ref?: boolean
    config?: boolean
    credentials?: boolean
    applicationRef?: boolean
    productRef?: boolean
  }

  export type IntelligenceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    application?: boolean | ApplicationDefaultArgs<ExtArgs>
    Product?: boolean | ProductDefaultArgs<ExtArgs>
  }
  export type IntelligenceIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    application?: boolean | ApplicationDefaultArgs<ExtArgs>
    Product?: boolean | ProductDefaultArgs<ExtArgs>
  }

  export type $IntelligencePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Intelligence"
    objects: {
      application: Prisma.$ApplicationPayload<ExtArgs>
      Product: Prisma.$ProductPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      ref: string
      config: Prisma.JsonValue
      /**
       * @encrypted
       */
      credentials: string
      applicationRef: string
      productRef: string
    }, ExtArgs["result"]["intelligence"]>
    composites: {}
  }

  type IntelligenceGetPayload<S extends boolean | null | undefined | IntelligenceDefaultArgs> = $Result.GetResult<Prisma.$IntelligencePayload, S>

  type IntelligenceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<IntelligenceFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: IntelligenceCountAggregateInputType | true
    }

  export interface IntelligenceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Intelligence'], meta: { name: 'Intelligence' } }
    /**
     * Find zero or one Intelligence that matches the filter.
     * @param {IntelligenceFindUniqueArgs} args - Arguments to find a Intelligence
     * @example
     * // Get one Intelligence
     * const intelligence = await prisma.intelligence.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends IntelligenceFindUniqueArgs>(args: SelectSubset<T, IntelligenceFindUniqueArgs<ExtArgs>>): Prisma__IntelligenceClient<$Result.GetResult<Prisma.$IntelligencePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Intelligence that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {IntelligenceFindUniqueOrThrowArgs} args - Arguments to find a Intelligence
     * @example
     * // Get one Intelligence
     * const intelligence = await prisma.intelligence.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends IntelligenceFindUniqueOrThrowArgs>(args: SelectSubset<T, IntelligenceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__IntelligenceClient<$Result.GetResult<Prisma.$IntelligencePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Intelligence that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntelligenceFindFirstArgs} args - Arguments to find a Intelligence
     * @example
     * // Get one Intelligence
     * const intelligence = await prisma.intelligence.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends IntelligenceFindFirstArgs>(args?: SelectSubset<T, IntelligenceFindFirstArgs<ExtArgs>>): Prisma__IntelligenceClient<$Result.GetResult<Prisma.$IntelligencePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Intelligence that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntelligenceFindFirstOrThrowArgs} args - Arguments to find a Intelligence
     * @example
     * // Get one Intelligence
     * const intelligence = await prisma.intelligence.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends IntelligenceFindFirstOrThrowArgs>(args?: SelectSubset<T, IntelligenceFindFirstOrThrowArgs<ExtArgs>>): Prisma__IntelligenceClient<$Result.GetResult<Prisma.$IntelligencePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Intelligences that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntelligenceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Intelligences
     * const intelligences = await prisma.intelligence.findMany()
     * 
     * // Get first 10 Intelligences
     * const intelligences = await prisma.intelligence.findMany({ take: 10 })
     * 
     * // Only select the `ref`
     * const intelligenceWithRefOnly = await prisma.intelligence.findMany({ select: { ref: true } })
     * 
     */
    findMany<T extends IntelligenceFindManyArgs>(args?: SelectSubset<T, IntelligenceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntelligencePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Intelligence.
     * @param {IntelligenceCreateArgs} args - Arguments to create a Intelligence.
     * @example
     * // Create one Intelligence
     * const Intelligence = await prisma.intelligence.create({
     *   data: {
     *     // ... data to create a Intelligence
     *   }
     * })
     * 
     */
    create<T extends IntelligenceCreateArgs>(args: SelectSubset<T, IntelligenceCreateArgs<ExtArgs>>): Prisma__IntelligenceClient<$Result.GetResult<Prisma.$IntelligencePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Intelligences.
     * @param {IntelligenceCreateManyArgs} args - Arguments to create many Intelligences.
     * @example
     * // Create many Intelligences
     * const intelligence = await prisma.intelligence.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends IntelligenceCreateManyArgs>(args?: SelectSubset<T, IntelligenceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Intelligences and returns the data saved in the database.
     * @param {IntelligenceCreateManyAndReturnArgs} args - Arguments to create many Intelligences.
     * @example
     * // Create many Intelligences
     * const intelligence = await prisma.intelligence.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Intelligences and only return the `ref`
     * const intelligenceWithRefOnly = await prisma.intelligence.createManyAndReturn({ 
     *   select: { ref: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends IntelligenceCreateManyAndReturnArgs>(args?: SelectSubset<T, IntelligenceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntelligencePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Intelligence.
     * @param {IntelligenceDeleteArgs} args - Arguments to delete one Intelligence.
     * @example
     * // Delete one Intelligence
     * const Intelligence = await prisma.intelligence.delete({
     *   where: {
     *     // ... filter to delete one Intelligence
     *   }
     * })
     * 
     */
    delete<T extends IntelligenceDeleteArgs>(args: SelectSubset<T, IntelligenceDeleteArgs<ExtArgs>>): Prisma__IntelligenceClient<$Result.GetResult<Prisma.$IntelligencePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Intelligence.
     * @param {IntelligenceUpdateArgs} args - Arguments to update one Intelligence.
     * @example
     * // Update one Intelligence
     * const intelligence = await prisma.intelligence.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends IntelligenceUpdateArgs>(args: SelectSubset<T, IntelligenceUpdateArgs<ExtArgs>>): Prisma__IntelligenceClient<$Result.GetResult<Prisma.$IntelligencePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Intelligences.
     * @param {IntelligenceDeleteManyArgs} args - Arguments to filter Intelligences to delete.
     * @example
     * // Delete a few Intelligences
     * const { count } = await prisma.intelligence.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends IntelligenceDeleteManyArgs>(args?: SelectSubset<T, IntelligenceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Intelligences.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntelligenceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Intelligences
     * const intelligence = await prisma.intelligence.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends IntelligenceUpdateManyArgs>(args: SelectSubset<T, IntelligenceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Intelligence.
     * @param {IntelligenceUpsertArgs} args - Arguments to update or create a Intelligence.
     * @example
     * // Update or create a Intelligence
     * const intelligence = await prisma.intelligence.upsert({
     *   create: {
     *     // ... data to create a Intelligence
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Intelligence we want to update
     *   }
     * })
     */
    upsert<T extends IntelligenceUpsertArgs>(args: SelectSubset<T, IntelligenceUpsertArgs<ExtArgs>>): Prisma__IntelligenceClient<$Result.GetResult<Prisma.$IntelligencePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Intelligences.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntelligenceCountArgs} args - Arguments to filter Intelligences to count.
     * @example
     * // Count the number of Intelligences
     * const count = await prisma.intelligence.count({
     *   where: {
     *     // ... the filter for the Intelligences we want to count
     *   }
     * })
    **/
    count<T extends IntelligenceCountArgs>(
      args?: Subset<T, IntelligenceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], IntelligenceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Intelligence.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntelligenceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends IntelligenceAggregateArgs>(args: Subset<T, IntelligenceAggregateArgs>): Prisma.PrismaPromise<GetIntelligenceAggregateType<T>>

    /**
     * Group by Intelligence.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntelligenceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends IntelligenceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: IntelligenceGroupByArgs['orderBy'] }
        : { orderBy?: IntelligenceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, IntelligenceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIntelligenceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Intelligence model
   */
  readonly fields: IntelligenceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Intelligence.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__IntelligenceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    application<T extends ApplicationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ApplicationDefaultArgs<ExtArgs>>): Prisma__ApplicationClient<$Result.GetResult<Prisma.$ApplicationPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    Product<T extends ProductDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProductDefaultArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Intelligence model
   */ 
  interface IntelligenceFieldRefs {
    readonly ref: FieldRef<"Intelligence", 'String'>
    readonly config: FieldRef<"Intelligence", 'Json'>
    readonly credentials: FieldRef<"Intelligence", 'String'>
    readonly applicationRef: FieldRef<"Intelligence", 'String'>
    readonly productRef: FieldRef<"Intelligence", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Intelligence findUnique
   */
  export type IntelligenceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Intelligence
     */
    select?: IntelligenceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntelligenceInclude<ExtArgs> | null
    /**
     * Filter, which Intelligence to fetch.
     */
    where: IntelligenceWhereUniqueInput
  }

  /**
   * Intelligence findUniqueOrThrow
   */
  export type IntelligenceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Intelligence
     */
    select?: IntelligenceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntelligenceInclude<ExtArgs> | null
    /**
     * Filter, which Intelligence to fetch.
     */
    where: IntelligenceWhereUniqueInput
  }

  /**
   * Intelligence findFirst
   */
  export type IntelligenceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Intelligence
     */
    select?: IntelligenceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntelligenceInclude<ExtArgs> | null
    /**
     * Filter, which Intelligence to fetch.
     */
    where?: IntelligenceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Intelligences to fetch.
     */
    orderBy?: IntelligenceOrderByWithRelationInput | IntelligenceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Intelligences.
     */
    cursor?: IntelligenceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Intelligences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Intelligences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Intelligences.
     */
    distinct?: IntelligenceScalarFieldEnum | IntelligenceScalarFieldEnum[]
  }

  /**
   * Intelligence findFirstOrThrow
   */
  export type IntelligenceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Intelligence
     */
    select?: IntelligenceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntelligenceInclude<ExtArgs> | null
    /**
     * Filter, which Intelligence to fetch.
     */
    where?: IntelligenceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Intelligences to fetch.
     */
    orderBy?: IntelligenceOrderByWithRelationInput | IntelligenceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Intelligences.
     */
    cursor?: IntelligenceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Intelligences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Intelligences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Intelligences.
     */
    distinct?: IntelligenceScalarFieldEnum | IntelligenceScalarFieldEnum[]
  }

  /**
   * Intelligence findMany
   */
  export type IntelligenceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Intelligence
     */
    select?: IntelligenceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntelligenceInclude<ExtArgs> | null
    /**
     * Filter, which Intelligences to fetch.
     */
    where?: IntelligenceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Intelligences to fetch.
     */
    orderBy?: IntelligenceOrderByWithRelationInput | IntelligenceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Intelligences.
     */
    cursor?: IntelligenceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Intelligences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Intelligences.
     */
    skip?: number
    distinct?: IntelligenceScalarFieldEnum | IntelligenceScalarFieldEnum[]
  }

  /**
   * Intelligence create
   */
  export type IntelligenceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Intelligence
     */
    select?: IntelligenceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntelligenceInclude<ExtArgs> | null
    /**
     * The data needed to create a Intelligence.
     */
    data: XOR<IntelligenceCreateInput, IntelligenceUncheckedCreateInput>
  }

  /**
   * Intelligence createMany
   */
  export type IntelligenceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Intelligences.
     */
    data: IntelligenceCreateManyInput | IntelligenceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Intelligence createManyAndReturn
   */
  export type IntelligenceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Intelligence
     */
    select?: IntelligenceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Intelligences.
     */
    data: IntelligenceCreateManyInput | IntelligenceCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntelligenceIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Intelligence update
   */
  export type IntelligenceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Intelligence
     */
    select?: IntelligenceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntelligenceInclude<ExtArgs> | null
    /**
     * The data needed to update a Intelligence.
     */
    data: XOR<IntelligenceUpdateInput, IntelligenceUncheckedUpdateInput>
    /**
     * Choose, which Intelligence to update.
     */
    where: IntelligenceWhereUniqueInput
  }

  /**
   * Intelligence updateMany
   */
  export type IntelligenceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Intelligences.
     */
    data: XOR<IntelligenceUpdateManyMutationInput, IntelligenceUncheckedUpdateManyInput>
    /**
     * Filter which Intelligences to update
     */
    where?: IntelligenceWhereInput
  }

  /**
   * Intelligence upsert
   */
  export type IntelligenceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Intelligence
     */
    select?: IntelligenceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntelligenceInclude<ExtArgs> | null
    /**
     * The filter to search for the Intelligence to update in case it exists.
     */
    where: IntelligenceWhereUniqueInput
    /**
     * In case the Intelligence found by the `where` argument doesn't exist, create a new Intelligence with this data.
     */
    create: XOR<IntelligenceCreateInput, IntelligenceUncheckedCreateInput>
    /**
     * In case the Intelligence was found with the provided `where` argument, update it with this data.
     */
    update: XOR<IntelligenceUpdateInput, IntelligenceUncheckedUpdateInput>
  }

  /**
   * Intelligence delete
   */
  export type IntelligenceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Intelligence
     */
    select?: IntelligenceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntelligenceInclude<ExtArgs> | null
    /**
     * Filter which Intelligence to delete.
     */
    where: IntelligenceWhereUniqueInput
  }

  /**
   * Intelligence deleteMany
   */
  export type IntelligenceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Intelligences to delete
     */
    where?: IntelligenceWhereInput
  }

  /**
   * Intelligence without action
   */
  export type IntelligenceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Intelligence
     */
    select?: IntelligenceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntelligenceInclude<ExtArgs> | null
  }


  /**
   * Model Product
   */

  export type AggregateProduct = {
    _count: ProductCountAggregateOutputType | null
    _min: ProductMinAggregateOutputType | null
    _max: ProductMaxAggregateOutputType | null
  }

  export type ProductMinAggregateOutputType = {
    ref: string | null
    name: string | null
    vendor: $Enums.ProductVendor | null
    type: $Enums.ProductType | null
  }

  export type ProductMaxAggregateOutputType = {
    ref: string | null
    name: string | null
    vendor: $Enums.ProductVendor | null
    type: $Enums.ProductType | null
  }

  export type ProductCountAggregateOutputType = {
    ref: number
    name: number
    vendor: number
    type: number
    _all: number
  }


  export type ProductMinAggregateInputType = {
    ref?: true
    name?: true
    vendor?: true
    type?: true
  }

  export type ProductMaxAggregateInputType = {
    ref?: true
    name?: true
    vendor?: true
    type?: true
  }

  export type ProductCountAggregateInputType = {
    ref?: true
    name?: true
    vendor?: true
    type?: true
    _all?: true
  }

  export type ProductAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Product to aggregate.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Products
    **/
    _count?: true | ProductCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProductMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProductMaxAggregateInputType
  }

  export type GetProductAggregateType<T extends ProductAggregateArgs> = {
        [P in keyof T & keyof AggregateProduct]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProduct[P]>
      : GetScalarType<T[P], AggregateProduct[P]>
  }




  export type ProductGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProductWhereInput
    orderBy?: ProductOrderByWithAggregationInput | ProductOrderByWithAggregationInput[]
    by: ProductScalarFieldEnum[] | ProductScalarFieldEnum
    having?: ProductScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProductCountAggregateInputType | true
    _min?: ProductMinAggregateInputType
    _max?: ProductMaxAggregateInputType
  }

  export type ProductGroupByOutputType = {
    ref: string
    name: string
    vendor: $Enums.ProductVendor
    type: $Enums.ProductType
    _count: ProductCountAggregateOutputType | null
    _min: ProductMinAggregateOutputType | null
    _max: ProductMaxAggregateOutputType | null
  }

  type GetProductGroupByPayload<T extends ProductGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProductGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProductGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProductGroupByOutputType[P]>
            : GetScalarType<T[P], ProductGroupByOutputType[P]>
        }
      >
    >


  export type ProductSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    ref?: boolean
    name?: boolean
    vendor?: boolean
    type?: boolean
    speechToText?: boolean | Product$speechToTextArgs<ExtArgs>
    sextToSpeech?: boolean | Product$sextToSpeechArgs<ExtArgs>
    intelligence?: boolean | Product$intelligenceArgs<ExtArgs>
    _count?: boolean | ProductCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["product"]>

  export type ProductSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    ref?: boolean
    name?: boolean
    vendor?: boolean
    type?: boolean
  }, ExtArgs["result"]["product"]>

  export type ProductSelectScalar = {
    ref?: boolean
    name?: boolean
    vendor?: boolean
    type?: boolean
  }

  export type ProductInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    speechToText?: boolean | Product$speechToTextArgs<ExtArgs>
    sextToSpeech?: boolean | Product$sextToSpeechArgs<ExtArgs>
    intelligence?: boolean | Product$intelligenceArgs<ExtArgs>
    _count?: boolean | ProductCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ProductIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ProductPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Product"
    objects: {
      speechToText: Prisma.$SpeechToTextPayload<ExtArgs>[]
      sextToSpeech: Prisma.$TextToSpeechPayload<ExtArgs>[]
      intelligence: Prisma.$IntelligencePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      ref: string
      name: string
      vendor: $Enums.ProductVendor
      type: $Enums.ProductType
    }, ExtArgs["result"]["product"]>
    composites: {}
  }

  type ProductGetPayload<S extends boolean | null | undefined | ProductDefaultArgs> = $Result.GetResult<Prisma.$ProductPayload, S>

  type ProductCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ProductFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ProductCountAggregateInputType | true
    }

  export interface ProductDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Product'], meta: { name: 'Product' } }
    /**
     * Find zero or one Product that matches the filter.
     * @param {ProductFindUniqueArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProductFindUniqueArgs>(args: SelectSubset<T, ProductFindUniqueArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Product that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ProductFindUniqueOrThrowArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProductFindUniqueOrThrowArgs>(args: SelectSubset<T, ProductFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Product that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindFirstArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProductFindFirstArgs>(args?: SelectSubset<T, ProductFindFirstArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Product that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindFirstOrThrowArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProductFindFirstOrThrowArgs>(args?: SelectSubset<T, ProductFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Products that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Products
     * const products = await prisma.product.findMany()
     * 
     * // Get first 10 Products
     * const products = await prisma.product.findMany({ take: 10 })
     * 
     * // Only select the `ref`
     * const productWithRefOnly = await prisma.product.findMany({ select: { ref: true } })
     * 
     */
    findMany<T extends ProductFindManyArgs>(args?: SelectSubset<T, ProductFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Product.
     * @param {ProductCreateArgs} args - Arguments to create a Product.
     * @example
     * // Create one Product
     * const Product = await prisma.product.create({
     *   data: {
     *     // ... data to create a Product
     *   }
     * })
     * 
     */
    create<T extends ProductCreateArgs>(args: SelectSubset<T, ProductCreateArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Products.
     * @param {ProductCreateManyArgs} args - Arguments to create many Products.
     * @example
     * // Create many Products
     * const product = await prisma.product.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProductCreateManyArgs>(args?: SelectSubset<T, ProductCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Products and returns the data saved in the database.
     * @param {ProductCreateManyAndReturnArgs} args - Arguments to create many Products.
     * @example
     * // Create many Products
     * const product = await prisma.product.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Products and only return the `ref`
     * const productWithRefOnly = await prisma.product.createManyAndReturn({ 
     *   select: { ref: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProductCreateManyAndReturnArgs>(args?: SelectSubset<T, ProductCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Product.
     * @param {ProductDeleteArgs} args - Arguments to delete one Product.
     * @example
     * // Delete one Product
     * const Product = await prisma.product.delete({
     *   where: {
     *     // ... filter to delete one Product
     *   }
     * })
     * 
     */
    delete<T extends ProductDeleteArgs>(args: SelectSubset<T, ProductDeleteArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Product.
     * @param {ProductUpdateArgs} args - Arguments to update one Product.
     * @example
     * // Update one Product
     * const product = await prisma.product.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProductUpdateArgs>(args: SelectSubset<T, ProductUpdateArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Products.
     * @param {ProductDeleteManyArgs} args - Arguments to filter Products to delete.
     * @example
     * // Delete a few Products
     * const { count } = await prisma.product.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProductDeleteManyArgs>(args?: SelectSubset<T, ProductDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Products.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Products
     * const product = await prisma.product.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProductUpdateManyArgs>(args: SelectSubset<T, ProductUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Product.
     * @param {ProductUpsertArgs} args - Arguments to update or create a Product.
     * @example
     * // Update or create a Product
     * const product = await prisma.product.upsert({
     *   create: {
     *     // ... data to create a Product
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Product we want to update
     *   }
     * })
     */
    upsert<T extends ProductUpsertArgs>(args: SelectSubset<T, ProductUpsertArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Products.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductCountArgs} args - Arguments to filter Products to count.
     * @example
     * // Count the number of Products
     * const count = await prisma.product.count({
     *   where: {
     *     // ... the filter for the Products we want to count
     *   }
     * })
    **/
    count<T extends ProductCountArgs>(
      args?: Subset<T, ProductCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProductCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Product.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProductAggregateArgs>(args: Subset<T, ProductAggregateArgs>): Prisma.PrismaPromise<GetProductAggregateType<T>>

    /**
     * Group by Product.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProductGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProductGroupByArgs['orderBy'] }
        : { orderBy?: ProductGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProductGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProductGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Product model
   */
  readonly fields: ProductFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Product.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProductClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    speechToText<T extends Product$speechToTextArgs<ExtArgs> = {}>(args?: Subset<T, Product$speechToTextArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpeechToTextPayload<ExtArgs>, T, "findMany"> | Null>
    sextToSpeech<T extends Product$sextToSpeechArgs<ExtArgs> = {}>(args?: Subset<T, Product$sextToSpeechArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TextToSpeechPayload<ExtArgs>, T, "findMany"> | Null>
    intelligence<T extends Product$intelligenceArgs<ExtArgs> = {}>(args?: Subset<T, Product$intelligenceArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntelligencePayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Product model
   */ 
  interface ProductFieldRefs {
    readonly ref: FieldRef<"Product", 'String'>
    readonly name: FieldRef<"Product", 'String'>
    readonly vendor: FieldRef<"Product", 'ProductVendor'>
    readonly type: FieldRef<"Product", 'ProductType'>
  }
    

  // Custom InputTypes
  /**
   * Product findUnique
   */
  export type ProductFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product findUniqueOrThrow
   */
  export type ProductFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product findFirst
   */
  export type ProductFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Products.
     */
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product findFirstOrThrow
   */
  export type ProductFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Products.
     */
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product findMany
   */
  export type ProductFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Products to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product create
   */
  export type ProductCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * The data needed to create a Product.
     */
    data: XOR<ProductCreateInput, ProductUncheckedCreateInput>
  }

  /**
   * Product createMany
   */
  export type ProductCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Products.
     */
    data: ProductCreateManyInput | ProductCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Product createManyAndReturn
   */
  export type ProductCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Products.
     */
    data: ProductCreateManyInput | ProductCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Product update
   */
  export type ProductUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * The data needed to update a Product.
     */
    data: XOR<ProductUpdateInput, ProductUncheckedUpdateInput>
    /**
     * Choose, which Product to update.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product updateMany
   */
  export type ProductUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Products.
     */
    data: XOR<ProductUpdateManyMutationInput, ProductUncheckedUpdateManyInput>
    /**
     * Filter which Products to update
     */
    where?: ProductWhereInput
  }

  /**
   * Product upsert
   */
  export type ProductUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * The filter to search for the Product to update in case it exists.
     */
    where: ProductWhereUniqueInput
    /**
     * In case the Product found by the `where` argument doesn't exist, create a new Product with this data.
     */
    create: XOR<ProductCreateInput, ProductUncheckedCreateInput>
    /**
     * In case the Product was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProductUpdateInput, ProductUncheckedUpdateInput>
  }

  /**
   * Product delete
   */
  export type ProductDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter which Product to delete.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product deleteMany
   */
  export type ProductDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Products to delete
     */
    where?: ProductWhereInput
  }

  /**
   * Product.speechToText
   */
  export type Product$speechToTextArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpeechToText
     */
    select?: SpeechToTextSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpeechToTextInclude<ExtArgs> | null
    where?: SpeechToTextWhereInput
    orderBy?: SpeechToTextOrderByWithRelationInput | SpeechToTextOrderByWithRelationInput[]
    cursor?: SpeechToTextWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SpeechToTextScalarFieldEnum | SpeechToTextScalarFieldEnum[]
  }

  /**
   * Product.sextToSpeech
   */
  export type Product$sextToSpeechArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TextToSpeech
     */
    select?: TextToSpeechSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TextToSpeechInclude<ExtArgs> | null
    where?: TextToSpeechWhereInput
    orderBy?: TextToSpeechOrderByWithRelationInput | TextToSpeechOrderByWithRelationInput[]
    cursor?: TextToSpeechWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TextToSpeechScalarFieldEnum | TextToSpeechScalarFieldEnum[]
  }

  /**
   * Product.intelligence
   */
  export type Product$intelligenceArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Intelligence
     */
    select?: IntelligenceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntelligenceInclude<ExtArgs> | null
    where?: IntelligenceWhereInput
    orderBy?: IntelligenceOrderByWithRelationInput | IntelligenceOrderByWithRelationInput[]
    cursor?: IntelligenceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: IntelligenceScalarFieldEnum | IntelligenceScalarFieldEnum[]
  }

  /**
   * Product without action
   */
  export type ProductDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
  }


  /**
   * Model Secret
   */

  export type AggregateSecret = {
    _count: SecretCountAggregateOutputType | null
    _min: SecretMinAggregateOutputType | null
    _max: SecretMaxAggregateOutputType | null
  }

  export type SecretMinAggregateOutputType = {
    ref: string | null
    accessKeyId: string | null
    name: string | null
    secret: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SecretMaxAggregateOutputType = {
    ref: string | null
    accessKeyId: string | null
    name: string | null
    secret: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SecretCountAggregateOutputType = {
    ref: number
    accessKeyId: number
    name: number
    secret: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SecretMinAggregateInputType = {
    ref?: true
    accessKeyId?: true
    name?: true
    secret?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SecretMaxAggregateInputType = {
    ref?: true
    accessKeyId?: true
    name?: true
    secret?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SecretCountAggregateInputType = {
    ref?: true
    accessKeyId?: true
    name?: true
    secret?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SecretAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Secret to aggregate.
     */
    where?: SecretWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Secrets to fetch.
     */
    orderBy?: SecretOrderByWithRelationInput | SecretOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SecretWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Secrets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Secrets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Secrets
    **/
    _count?: true | SecretCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SecretMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SecretMaxAggregateInputType
  }

  export type GetSecretAggregateType<T extends SecretAggregateArgs> = {
        [P in keyof T & keyof AggregateSecret]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSecret[P]>
      : GetScalarType<T[P], AggregateSecret[P]>
  }




  export type SecretGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SecretWhereInput
    orderBy?: SecretOrderByWithAggregationInput | SecretOrderByWithAggregationInput[]
    by: SecretScalarFieldEnum[] | SecretScalarFieldEnum
    having?: SecretScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SecretCountAggregateInputType | true
    _min?: SecretMinAggregateInputType
    _max?: SecretMaxAggregateInputType
  }

  export type SecretGroupByOutputType = {
    ref: string
    accessKeyId: string
    name: string
    secret: string
    createdAt: Date
    updatedAt: Date
    _count: SecretCountAggregateOutputType | null
    _min: SecretMinAggregateOutputType | null
    _max: SecretMaxAggregateOutputType | null
  }

  type GetSecretGroupByPayload<T extends SecretGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SecretGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SecretGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SecretGroupByOutputType[P]>
            : GetScalarType<T[P], SecretGroupByOutputType[P]>
        }
      >
    >


  export type SecretSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    ref?: boolean
    accessKeyId?: boolean
    name?: boolean
    secret?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["secret"]>

  export type SecretSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    ref?: boolean
    accessKeyId?: boolean
    name?: boolean
    secret?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["secret"]>

  export type SecretSelectScalar = {
    ref?: boolean
    accessKeyId?: boolean
    name?: boolean
    secret?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $SecretPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Secret"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      ref: string
      accessKeyId: string
      name: string
      /**
       * @encrypted
       */
      secret: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["secret"]>
    composites: {}
  }

  type SecretGetPayload<S extends boolean | null | undefined | SecretDefaultArgs> = $Result.GetResult<Prisma.$SecretPayload, S>

  type SecretCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SecretFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SecretCountAggregateInputType | true
    }

  export interface SecretDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Secret'], meta: { name: 'Secret' } }
    /**
     * Find zero or one Secret that matches the filter.
     * @param {SecretFindUniqueArgs} args - Arguments to find a Secret
     * @example
     * // Get one Secret
     * const secret = await prisma.secret.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SecretFindUniqueArgs>(args: SelectSubset<T, SecretFindUniqueArgs<ExtArgs>>): Prisma__SecretClient<$Result.GetResult<Prisma.$SecretPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Secret that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SecretFindUniqueOrThrowArgs} args - Arguments to find a Secret
     * @example
     * // Get one Secret
     * const secret = await prisma.secret.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SecretFindUniqueOrThrowArgs>(args: SelectSubset<T, SecretFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SecretClient<$Result.GetResult<Prisma.$SecretPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Secret that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretFindFirstArgs} args - Arguments to find a Secret
     * @example
     * // Get one Secret
     * const secret = await prisma.secret.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SecretFindFirstArgs>(args?: SelectSubset<T, SecretFindFirstArgs<ExtArgs>>): Prisma__SecretClient<$Result.GetResult<Prisma.$SecretPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Secret that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretFindFirstOrThrowArgs} args - Arguments to find a Secret
     * @example
     * // Get one Secret
     * const secret = await prisma.secret.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SecretFindFirstOrThrowArgs>(args?: SelectSubset<T, SecretFindFirstOrThrowArgs<ExtArgs>>): Prisma__SecretClient<$Result.GetResult<Prisma.$SecretPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Secrets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Secrets
     * const secrets = await prisma.secret.findMany()
     * 
     * // Get first 10 Secrets
     * const secrets = await prisma.secret.findMany({ take: 10 })
     * 
     * // Only select the `ref`
     * const secretWithRefOnly = await prisma.secret.findMany({ select: { ref: true } })
     * 
     */
    findMany<T extends SecretFindManyArgs>(args?: SelectSubset<T, SecretFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SecretPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Secret.
     * @param {SecretCreateArgs} args - Arguments to create a Secret.
     * @example
     * // Create one Secret
     * const Secret = await prisma.secret.create({
     *   data: {
     *     // ... data to create a Secret
     *   }
     * })
     * 
     */
    create<T extends SecretCreateArgs>(args: SelectSubset<T, SecretCreateArgs<ExtArgs>>): Prisma__SecretClient<$Result.GetResult<Prisma.$SecretPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Secrets.
     * @param {SecretCreateManyArgs} args - Arguments to create many Secrets.
     * @example
     * // Create many Secrets
     * const secret = await prisma.secret.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SecretCreateManyArgs>(args?: SelectSubset<T, SecretCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Secrets and returns the data saved in the database.
     * @param {SecretCreateManyAndReturnArgs} args - Arguments to create many Secrets.
     * @example
     * // Create many Secrets
     * const secret = await prisma.secret.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Secrets and only return the `ref`
     * const secretWithRefOnly = await prisma.secret.createManyAndReturn({ 
     *   select: { ref: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SecretCreateManyAndReturnArgs>(args?: SelectSubset<T, SecretCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SecretPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Secret.
     * @param {SecretDeleteArgs} args - Arguments to delete one Secret.
     * @example
     * // Delete one Secret
     * const Secret = await prisma.secret.delete({
     *   where: {
     *     // ... filter to delete one Secret
     *   }
     * })
     * 
     */
    delete<T extends SecretDeleteArgs>(args: SelectSubset<T, SecretDeleteArgs<ExtArgs>>): Prisma__SecretClient<$Result.GetResult<Prisma.$SecretPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Secret.
     * @param {SecretUpdateArgs} args - Arguments to update one Secret.
     * @example
     * // Update one Secret
     * const secret = await prisma.secret.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SecretUpdateArgs>(args: SelectSubset<T, SecretUpdateArgs<ExtArgs>>): Prisma__SecretClient<$Result.GetResult<Prisma.$SecretPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Secrets.
     * @param {SecretDeleteManyArgs} args - Arguments to filter Secrets to delete.
     * @example
     * // Delete a few Secrets
     * const { count } = await prisma.secret.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SecretDeleteManyArgs>(args?: SelectSubset<T, SecretDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Secrets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Secrets
     * const secret = await prisma.secret.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SecretUpdateManyArgs>(args: SelectSubset<T, SecretUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Secret.
     * @param {SecretUpsertArgs} args - Arguments to update or create a Secret.
     * @example
     * // Update or create a Secret
     * const secret = await prisma.secret.upsert({
     *   create: {
     *     // ... data to create a Secret
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Secret we want to update
     *   }
     * })
     */
    upsert<T extends SecretUpsertArgs>(args: SelectSubset<T, SecretUpsertArgs<ExtArgs>>): Prisma__SecretClient<$Result.GetResult<Prisma.$SecretPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Secrets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretCountArgs} args - Arguments to filter Secrets to count.
     * @example
     * // Count the number of Secrets
     * const count = await prisma.secret.count({
     *   where: {
     *     // ... the filter for the Secrets we want to count
     *   }
     * })
    **/
    count<T extends SecretCountArgs>(
      args?: Subset<T, SecretCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SecretCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Secret.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SecretAggregateArgs>(args: Subset<T, SecretAggregateArgs>): Prisma.PrismaPromise<GetSecretAggregateType<T>>

    /**
     * Group by Secret.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SecretGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SecretGroupByArgs['orderBy'] }
        : { orderBy?: SecretGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SecretGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSecretGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Secret model
   */
  readonly fields: SecretFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Secret.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SecretClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Secret model
   */ 
  interface SecretFieldRefs {
    readonly ref: FieldRef<"Secret", 'String'>
    readonly accessKeyId: FieldRef<"Secret", 'String'>
    readonly name: FieldRef<"Secret", 'String'>
    readonly secret: FieldRef<"Secret", 'String'>
    readonly createdAt: FieldRef<"Secret", 'DateTime'>
    readonly updatedAt: FieldRef<"Secret", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Secret findUnique
   */
  export type SecretFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Secret
     */
    select?: SecretSelect<ExtArgs> | null
    /**
     * Filter, which Secret to fetch.
     */
    where: SecretWhereUniqueInput
  }

  /**
   * Secret findUniqueOrThrow
   */
  export type SecretFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Secret
     */
    select?: SecretSelect<ExtArgs> | null
    /**
     * Filter, which Secret to fetch.
     */
    where: SecretWhereUniqueInput
  }

  /**
   * Secret findFirst
   */
  export type SecretFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Secret
     */
    select?: SecretSelect<ExtArgs> | null
    /**
     * Filter, which Secret to fetch.
     */
    where?: SecretWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Secrets to fetch.
     */
    orderBy?: SecretOrderByWithRelationInput | SecretOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Secrets.
     */
    cursor?: SecretWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Secrets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Secrets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Secrets.
     */
    distinct?: SecretScalarFieldEnum | SecretScalarFieldEnum[]
  }

  /**
   * Secret findFirstOrThrow
   */
  export type SecretFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Secret
     */
    select?: SecretSelect<ExtArgs> | null
    /**
     * Filter, which Secret to fetch.
     */
    where?: SecretWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Secrets to fetch.
     */
    orderBy?: SecretOrderByWithRelationInput | SecretOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Secrets.
     */
    cursor?: SecretWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Secrets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Secrets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Secrets.
     */
    distinct?: SecretScalarFieldEnum | SecretScalarFieldEnum[]
  }

  /**
   * Secret findMany
   */
  export type SecretFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Secret
     */
    select?: SecretSelect<ExtArgs> | null
    /**
     * Filter, which Secrets to fetch.
     */
    where?: SecretWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Secrets to fetch.
     */
    orderBy?: SecretOrderByWithRelationInput | SecretOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Secrets.
     */
    cursor?: SecretWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Secrets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Secrets.
     */
    skip?: number
    distinct?: SecretScalarFieldEnum | SecretScalarFieldEnum[]
  }

  /**
   * Secret create
   */
  export type SecretCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Secret
     */
    select?: SecretSelect<ExtArgs> | null
    /**
     * The data needed to create a Secret.
     */
    data: XOR<SecretCreateInput, SecretUncheckedCreateInput>
  }

  /**
   * Secret createMany
   */
  export type SecretCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Secrets.
     */
    data: SecretCreateManyInput | SecretCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Secret createManyAndReturn
   */
  export type SecretCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Secret
     */
    select?: SecretSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Secrets.
     */
    data: SecretCreateManyInput | SecretCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Secret update
   */
  export type SecretUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Secret
     */
    select?: SecretSelect<ExtArgs> | null
    /**
     * The data needed to update a Secret.
     */
    data: XOR<SecretUpdateInput, SecretUncheckedUpdateInput>
    /**
     * Choose, which Secret to update.
     */
    where: SecretWhereUniqueInput
  }

  /**
   * Secret updateMany
   */
  export type SecretUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Secrets.
     */
    data: XOR<SecretUpdateManyMutationInput, SecretUncheckedUpdateManyInput>
    /**
     * Filter which Secrets to update
     */
    where?: SecretWhereInput
  }

  /**
   * Secret upsert
   */
  export type SecretUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Secret
     */
    select?: SecretSelect<ExtArgs> | null
    /**
     * The filter to search for the Secret to update in case it exists.
     */
    where: SecretWhereUniqueInput
    /**
     * In case the Secret found by the `where` argument doesn't exist, create a new Secret with this data.
     */
    create: XOR<SecretCreateInput, SecretUncheckedCreateInput>
    /**
     * In case the Secret was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SecretUpdateInput, SecretUncheckedUpdateInput>
  }

  /**
   * Secret delete
   */
  export type SecretDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Secret
     */
    select?: SecretSelect<ExtArgs> | null
    /**
     * Filter which Secret to delete.
     */
    where: SecretWhereUniqueInput
  }

  /**
   * Secret deleteMany
   */
  export type SecretDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Secrets to delete
     */
    where?: SecretWhereInput
  }

  /**
   * Secret without action
   */
  export type SecretDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Secret
     */
    select?: SecretSelect<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ApplicationScalarFieldEnum: {
    ref: 'ref',
    accessKeyId: 'accessKeyId',
    name: 'name',
    type: 'type',
    endpoint: 'endpoint',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ApplicationScalarFieldEnum = (typeof ApplicationScalarFieldEnum)[keyof typeof ApplicationScalarFieldEnum]


  export const TextToSpeechScalarFieldEnum: {
    ref: 'ref',
    config: 'config',
    applicationRef: 'applicationRef',
    productRef: 'productRef'
  };

  export type TextToSpeechScalarFieldEnum = (typeof TextToSpeechScalarFieldEnum)[keyof typeof TextToSpeechScalarFieldEnum]


  export const SpeechToTextScalarFieldEnum: {
    ref: 'ref',
    config: 'config',
    applicationRef: 'applicationRef',
    productRef: 'productRef'
  };

  export type SpeechToTextScalarFieldEnum = (typeof SpeechToTextScalarFieldEnum)[keyof typeof SpeechToTextScalarFieldEnum]


  export const IntelligenceScalarFieldEnum: {
    ref: 'ref',
    config: 'config',
    credentials: 'credentials',
    applicationRef: 'applicationRef',
    productRef: 'productRef'
  };

  export type IntelligenceScalarFieldEnum = (typeof IntelligenceScalarFieldEnum)[keyof typeof IntelligenceScalarFieldEnum]


  export const ProductScalarFieldEnum: {
    ref: 'ref',
    name: 'name',
    vendor: 'vendor',
    type: 'type'
  };

  export type ProductScalarFieldEnum = (typeof ProductScalarFieldEnum)[keyof typeof ProductScalarFieldEnum]


  export const SecretScalarFieldEnum: {
    ref: 'ref',
    accessKeyId: 'accessKeyId',
    name: 'name',
    secret: 'secret',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SecretScalarFieldEnum = (typeof SecretScalarFieldEnum)[keyof typeof SecretScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'ApplicationType'
   */
  export type EnumApplicationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ApplicationType'>
    


  /**
   * Reference to a field of type 'ApplicationType[]'
   */
  export type ListEnumApplicationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ApplicationType[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'ProductVendor'
   */
  export type EnumProductVendorFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProductVendor'>
    


  /**
   * Reference to a field of type 'ProductVendor[]'
   */
  export type ListEnumProductVendorFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProductVendor[]'>
    


  /**
   * Reference to a field of type 'ProductType'
   */
  export type EnumProductTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProductType'>
    


  /**
   * Reference to a field of type 'ProductType[]'
   */
  export type ListEnumProductTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProductType[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type ApplicationWhereInput = {
    AND?: ApplicationWhereInput | ApplicationWhereInput[]
    OR?: ApplicationWhereInput[]
    NOT?: ApplicationWhereInput | ApplicationWhereInput[]
    ref?: StringFilter<"Application"> | string
    accessKeyId?: StringFilter<"Application"> | string
    name?: StringFilter<"Application"> | string
    type?: EnumApplicationTypeFilter<"Application"> | $Enums.ApplicationType
    endpoint?: StringFilter<"Application"> | string
    createdAt?: DateTimeFilter<"Application"> | Date | string
    updatedAt?: DateTimeFilter<"Application"> | Date | string
    textToSpeech?: XOR<TextToSpeechNullableScalarRelationFilter, TextToSpeechWhereInput> | null
    speechToText?: XOR<SpeechToTextNullableScalarRelationFilter, SpeechToTextWhereInput> | null
    intelligence?: XOR<IntelligenceNullableScalarRelationFilter, IntelligenceWhereInput> | null
  }

  export type ApplicationOrderByWithRelationInput = {
    ref?: SortOrder
    accessKeyId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    endpoint?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    textToSpeech?: TextToSpeechOrderByWithRelationInput
    speechToText?: SpeechToTextOrderByWithRelationInput
    intelligence?: IntelligenceOrderByWithRelationInput
  }

  export type ApplicationWhereUniqueInput = Prisma.AtLeast<{
    ref?: string
    AND?: ApplicationWhereInput | ApplicationWhereInput[]
    OR?: ApplicationWhereInput[]
    NOT?: ApplicationWhereInput | ApplicationWhereInput[]
    accessKeyId?: StringFilter<"Application"> | string
    name?: StringFilter<"Application"> | string
    type?: EnumApplicationTypeFilter<"Application"> | $Enums.ApplicationType
    endpoint?: StringFilter<"Application"> | string
    createdAt?: DateTimeFilter<"Application"> | Date | string
    updatedAt?: DateTimeFilter<"Application"> | Date | string
    textToSpeech?: XOR<TextToSpeechNullableScalarRelationFilter, TextToSpeechWhereInput> | null
    speechToText?: XOR<SpeechToTextNullableScalarRelationFilter, SpeechToTextWhereInput> | null
    intelligence?: XOR<IntelligenceNullableScalarRelationFilter, IntelligenceWhereInput> | null
  }, "ref">

  export type ApplicationOrderByWithAggregationInput = {
    ref?: SortOrder
    accessKeyId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    endpoint?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ApplicationCountOrderByAggregateInput
    _max?: ApplicationMaxOrderByAggregateInput
    _min?: ApplicationMinOrderByAggregateInput
  }

  export type ApplicationScalarWhereWithAggregatesInput = {
    AND?: ApplicationScalarWhereWithAggregatesInput | ApplicationScalarWhereWithAggregatesInput[]
    OR?: ApplicationScalarWhereWithAggregatesInput[]
    NOT?: ApplicationScalarWhereWithAggregatesInput | ApplicationScalarWhereWithAggregatesInput[]
    ref?: StringWithAggregatesFilter<"Application"> | string
    accessKeyId?: StringWithAggregatesFilter<"Application"> | string
    name?: StringWithAggregatesFilter<"Application"> | string
    type?: EnumApplicationTypeWithAggregatesFilter<"Application"> | $Enums.ApplicationType
    endpoint?: StringWithAggregatesFilter<"Application"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Application"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Application"> | Date | string
  }

  export type TextToSpeechWhereInput = {
    AND?: TextToSpeechWhereInput | TextToSpeechWhereInput[]
    OR?: TextToSpeechWhereInput[]
    NOT?: TextToSpeechWhereInput | TextToSpeechWhereInput[]
    ref?: StringFilter<"TextToSpeech"> | string
    config?: JsonFilter<"TextToSpeech">
    applicationRef?: StringFilter<"TextToSpeech"> | string
    productRef?: StringFilter<"TextToSpeech"> | string
    application?: XOR<ApplicationScalarRelationFilter, ApplicationWhereInput>
    product?: XOR<ProductScalarRelationFilter, ProductWhereInput>
  }

  export type TextToSpeechOrderByWithRelationInput = {
    ref?: SortOrder
    config?: SortOrder
    applicationRef?: SortOrder
    productRef?: SortOrder
    application?: ApplicationOrderByWithRelationInput
    product?: ProductOrderByWithRelationInput
  }

  export type TextToSpeechWhereUniqueInput = Prisma.AtLeast<{
    ref?: string
    applicationRef?: string
    AND?: TextToSpeechWhereInput | TextToSpeechWhereInput[]
    OR?: TextToSpeechWhereInput[]
    NOT?: TextToSpeechWhereInput | TextToSpeechWhereInput[]
    config?: JsonFilter<"TextToSpeech">
    productRef?: StringFilter<"TextToSpeech"> | string
    application?: XOR<ApplicationScalarRelationFilter, ApplicationWhereInput>
    product?: XOR<ProductScalarRelationFilter, ProductWhereInput>
  }, "ref" | "applicationRef">

  export type TextToSpeechOrderByWithAggregationInput = {
    ref?: SortOrder
    config?: SortOrder
    applicationRef?: SortOrder
    productRef?: SortOrder
    _count?: TextToSpeechCountOrderByAggregateInput
    _max?: TextToSpeechMaxOrderByAggregateInput
    _min?: TextToSpeechMinOrderByAggregateInput
  }

  export type TextToSpeechScalarWhereWithAggregatesInput = {
    AND?: TextToSpeechScalarWhereWithAggregatesInput | TextToSpeechScalarWhereWithAggregatesInput[]
    OR?: TextToSpeechScalarWhereWithAggregatesInput[]
    NOT?: TextToSpeechScalarWhereWithAggregatesInput | TextToSpeechScalarWhereWithAggregatesInput[]
    ref?: StringWithAggregatesFilter<"TextToSpeech"> | string
    config?: JsonWithAggregatesFilter<"TextToSpeech">
    applicationRef?: StringWithAggregatesFilter<"TextToSpeech"> | string
    productRef?: StringWithAggregatesFilter<"TextToSpeech"> | string
  }

  export type SpeechToTextWhereInput = {
    AND?: SpeechToTextWhereInput | SpeechToTextWhereInput[]
    OR?: SpeechToTextWhereInput[]
    NOT?: SpeechToTextWhereInput | SpeechToTextWhereInput[]
    ref?: StringFilter<"SpeechToText"> | string
    config?: JsonFilter<"SpeechToText">
    applicationRef?: StringFilter<"SpeechToText"> | string
    productRef?: StringFilter<"SpeechToText"> | string
    application?: XOR<ApplicationScalarRelationFilter, ApplicationWhereInput>
    product?: XOR<ProductScalarRelationFilter, ProductWhereInput>
  }

  export type SpeechToTextOrderByWithRelationInput = {
    ref?: SortOrder
    config?: SortOrder
    applicationRef?: SortOrder
    productRef?: SortOrder
    application?: ApplicationOrderByWithRelationInput
    product?: ProductOrderByWithRelationInput
  }

  export type SpeechToTextWhereUniqueInput = Prisma.AtLeast<{
    ref?: string
    applicationRef?: string
    AND?: SpeechToTextWhereInput | SpeechToTextWhereInput[]
    OR?: SpeechToTextWhereInput[]
    NOT?: SpeechToTextWhereInput | SpeechToTextWhereInput[]
    config?: JsonFilter<"SpeechToText">
    productRef?: StringFilter<"SpeechToText"> | string
    application?: XOR<ApplicationScalarRelationFilter, ApplicationWhereInput>
    product?: XOR<ProductScalarRelationFilter, ProductWhereInput>
  }, "ref" | "applicationRef">

  export type SpeechToTextOrderByWithAggregationInput = {
    ref?: SortOrder
    config?: SortOrder
    applicationRef?: SortOrder
    productRef?: SortOrder
    _count?: SpeechToTextCountOrderByAggregateInput
    _max?: SpeechToTextMaxOrderByAggregateInput
    _min?: SpeechToTextMinOrderByAggregateInput
  }

  export type SpeechToTextScalarWhereWithAggregatesInput = {
    AND?: SpeechToTextScalarWhereWithAggregatesInput | SpeechToTextScalarWhereWithAggregatesInput[]
    OR?: SpeechToTextScalarWhereWithAggregatesInput[]
    NOT?: SpeechToTextScalarWhereWithAggregatesInput | SpeechToTextScalarWhereWithAggregatesInput[]
    ref?: StringWithAggregatesFilter<"SpeechToText"> | string
    config?: JsonWithAggregatesFilter<"SpeechToText">
    applicationRef?: StringWithAggregatesFilter<"SpeechToText"> | string
    productRef?: StringWithAggregatesFilter<"SpeechToText"> | string
  }

  export type IntelligenceWhereInput = {
    AND?: IntelligenceWhereInput | IntelligenceWhereInput[]
    OR?: IntelligenceWhereInput[]
    NOT?: IntelligenceWhereInput | IntelligenceWhereInput[]
    ref?: StringFilter<"Intelligence"> | string
    config?: JsonFilter<"Intelligence">
    credentials?: StringFilter<"Intelligence"> | string
    applicationRef?: StringFilter<"Intelligence"> | string
    productRef?: StringFilter<"Intelligence"> | string
    application?: XOR<ApplicationScalarRelationFilter, ApplicationWhereInput>
    Product?: XOR<ProductScalarRelationFilter, ProductWhereInput>
  }

  export type IntelligenceOrderByWithRelationInput = {
    ref?: SortOrder
    config?: SortOrder
    credentials?: SortOrder
    applicationRef?: SortOrder
    productRef?: SortOrder
    application?: ApplicationOrderByWithRelationInput
    Product?: ProductOrderByWithRelationInput
  }

  export type IntelligenceWhereUniqueInput = Prisma.AtLeast<{
    ref?: string
    applicationRef?: string
    AND?: IntelligenceWhereInput | IntelligenceWhereInput[]
    OR?: IntelligenceWhereInput[]
    NOT?: IntelligenceWhereInput | IntelligenceWhereInput[]
    config?: JsonFilter<"Intelligence">
    credentials?: StringFilter<"Intelligence"> | string
    productRef?: StringFilter<"Intelligence"> | string
    application?: XOR<ApplicationScalarRelationFilter, ApplicationWhereInput>
    Product?: XOR<ProductScalarRelationFilter, ProductWhereInput>
  }, "ref" | "applicationRef">

  export type IntelligenceOrderByWithAggregationInput = {
    ref?: SortOrder
    config?: SortOrder
    credentials?: SortOrder
    applicationRef?: SortOrder
    productRef?: SortOrder
    _count?: IntelligenceCountOrderByAggregateInput
    _max?: IntelligenceMaxOrderByAggregateInput
    _min?: IntelligenceMinOrderByAggregateInput
  }

  export type IntelligenceScalarWhereWithAggregatesInput = {
    AND?: IntelligenceScalarWhereWithAggregatesInput | IntelligenceScalarWhereWithAggregatesInput[]
    OR?: IntelligenceScalarWhereWithAggregatesInput[]
    NOT?: IntelligenceScalarWhereWithAggregatesInput | IntelligenceScalarWhereWithAggregatesInput[]
    ref?: StringWithAggregatesFilter<"Intelligence"> | string
    config?: JsonWithAggregatesFilter<"Intelligence">
    credentials?: StringWithAggregatesFilter<"Intelligence"> | string
    applicationRef?: StringWithAggregatesFilter<"Intelligence"> | string
    productRef?: StringWithAggregatesFilter<"Intelligence"> | string
  }

  export type ProductWhereInput = {
    AND?: ProductWhereInput | ProductWhereInput[]
    OR?: ProductWhereInput[]
    NOT?: ProductWhereInput | ProductWhereInput[]
    ref?: StringFilter<"Product"> | string
    name?: StringFilter<"Product"> | string
    vendor?: EnumProductVendorFilter<"Product"> | $Enums.ProductVendor
    type?: EnumProductTypeFilter<"Product"> | $Enums.ProductType
    speechToText?: SpeechToTextListRelationFilter
    sextToSpeech?: TextToSpeechListRelationFilter
    intelligence?: IntelligenceListRelationFilter
  }

  export type ProductOrderByWithRelationInput = {
    ref?: SortOrder
    name?: SortOrder
    vendor?: SortOrder
    type?: SortOrder
    speechToText?: SpeechToTextOrderByRelationAggregateInput
    sextToSpeech?: TextToSpeechOrderByRelationAggregateInput
    intelligence?: IntelligenceOrderByRelationAggregateInput
  }

  export type ProductWhereUniqueInput = Prisma.AtLeast<{
    ref?: string
    AND?: ProductWhereInput | ProductWhereInput[]
    OR?: ProductWhereInput[]
    NOT?: ProductWhereInput | ProductWhereInput[]
    name?: StringFilter<"Product"> | string
    vendor?: EnumProductVendorFilter<"Product"> | $Enums.ProductVendor
    type?: EnumProductTypeFilter<"Product"> | $Enums.ProductType
    speechToText?: SpeechToTextListRelationFilter
    sextToSpeech?: TextToSpeechListRelationFilter
    intelligence?: IntelligenceListRelationFilter
  }, "ref">

  export type ProductOrderByWithAggregationInput = {
    ref?: SortOrder
    name?: SortOrder
    vendor?: SortOrder
    type?: SortOrder
    _count?: ProductCountOrderByAggregateInput
    _max?: ProductMaxOrderByAggregateInput
    _min?: ProductMinOrderByAggregateInput
  }

  export type ProductScalarWhereWithAggregatesInput = {
    AND?: ProductScalarWhereWithAggregatesInput | ProductScalarWhereWithAggregatesInput[]
    OR?: ProductScalarWhereWithAggregatesInput[]
    NOT?: ProductScalarWhereWithAggregatesInput | ProductScalarWhereWithAggregatesInput[]
    ref?: StringWithAggregatesFilter<"Product"> | string
    name?: StringWithAggregatesFilter<"Product"> | string
    vendor?: EnumProductVendorWithAggregatesFilter<"Product"> | $Enums.ProductVendor
    type?: EnumProductTypeWithAggregatesFilter<"Product"> | $Enums.ProductType
  }

  export type SecretWhereInput = {
    AND?: SecretWhereInput | SecretWhereInput[]
    OR?: SecretWhereInput[]
    NOT?: SecretWhereInput | SecretWhereInput[]
    ref?: StringFilter<"Secret"> | string
    accessKeyId?: StringFilter<"Secret"> | string
    name?: StringFilter<"Secret"> | string
    secret?: StringFilter<"Secret"> | string
    createdAt?: DateTimeFilter<"Secret"> | Date | string
    updatedAt?: DateTimeFilter<"Secret"> | Date | string
  }

  export type SecretOrderByWithRelationInput = {
    ref?: SortOrder
    accessKeyId?: SortOrder
    name?: SortOrder
    secret?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SecretWhereUniqueInput = Prisma.AtLeast<{
    ref?: string
    AND?: SecretWhereInput | SecretWhereInput[]
    OR?: SecretWhereInput[]
    NOT?: SecretWhereInput | SecretWhereInput[]
    accessKeyId?: StringFilter<"Secret"> | string
    name?: StringFilter<"Secret"> | string
    secret?: StringFilter<"Secret"> | string
    createdAt?: DateTimeFilter<"Secret"> | Date | string
    updatedAt?: DateTimeFilter<"Secret"> | Date | string
  }, "ref">

  export type SecretOrderByWithAggregationInput = {
    ref?: SortOrder
    accessKeyId?: SortOrder
    name?: SortOrder
    secret?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SecretCountOrderByAggregateInput
    _max?: SecretMaxOrderByAggregateInput
    _min?: SecretMinOrderByAggregateInput
  }

  export type SecretScalarWhereWithAggregatesInput = {
    AND?: SecretScalarWhereWithAggregatesInput | SecretScalarWhereWithAggregatesInput[]
    OR?: SecretScalarWhereWithAggregatesInput[]
    NOT?: SecretScalarWhereWithAggregatesInput | SecretScalarWhereWithAggregatesInput[]
    ref?: StringWithAggregatesFilter<"Secret"> | string
    accessKeyId?: StringWithAggregatesFilter<"Secret"> | string
    name?: StringWithAggregatesFilter<"Secret"> | string
    secret?: StringWithAggregatesFilter<"Secret"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Secret"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Secret"> | Date | string
  }

  export type ApplicationCreateInput = {
    ref?: string
    accessKeyId: string
    name: string
    type: $Enums.ApplicationType
    endpoint: string
    createdAt?: Date | string
    updatedAt?: Date | string
    textToSpeech?: TextToSpeechCreateNestedOneWithoutApplicationInput
    speechToText?: SpeechToTextCreateNestedOneWithoutApplicationInput
    intelligence?: IntelligenceCreateNestedOneWithoutApplicationInput
  }

  export type ApplicationUncheckedCreateInput = {
    ref?: string
    accessKeyId: string
    name: string
    type: $Enums.ApplicationType
    endpoint: string
    createdAt?: Date | string
    updatedAt?: Date | string
    textToSpeech?: TextToSpeechUncheckedCreateNestedOneWithoutApplicationInput
    speechToText?: SpeechToTextUncheckedCreateNestedOneWithoutApplicationInput
    intelligence?: IntelligenceUncheckedCreateNestedOneWithoutApplicationInput
  }

  export type ApplicationUpdateInput = {
    ref?: StringFieldUpdateOperationsInput | string
    accessKeyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumApplicationTypeFieldUpdateOperationsInput | $Enums.ApplicationType
    endpoint?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    textToSpeech?: TextToSpeechUpdateOneWithoutApplicationNestedInput
    speechToText?: SpeechToTextUpdateOneWithoutApplicationNestedInput
    intelligence?: IntelligenceUpdateOneWithoutApplicationNestedInput
  }

  export type ApplicationUncheckedUpdateInput = {
    ref?: StringFieldUpdateOperationsInput | string
    accessKeyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumApplicationTypeFieldUpdateOperationsInput | $Enums.ApplicationType
    endpoint?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    textToSpeech?: TextToSpeechUncheckedUpdateOneWithoutApplicationNestedInput
    speechToText?: SpeechToTextUncheckedUpdateOneWithoutApplicationNestedInput
    intelligence?: IntelligenceUncheckedUpdateOneWithoutApplicationNestedInput
  }

  export type ApplicationCreateManyInput = {
    ref?: string
    accessKeyId: string
    name: string
    type: $Enums.ApplicationType
    endpoint: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ApplicationUpdateManyMutationInput = {
    ref?: StringFieldUpdateOperationsInput | string
    accessKeyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumApplicationTypeFieldUpdateOperationsInput | $Enums.ApplicationType
    endpoint?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ApplicationUncheckedUpdateManyInput = {
    ref?: StringFieldUpdateOperationsInput | string
    accessKeyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumApplicationTypeFieldUpdateOperationsInput | $Enums.ApplicationType
    endpoint?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TextToSpeechCreateInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    application: ApplicationCreateNestedOneWithoutTextToSpeechInput
    product: ProductCreateNestedOneWithoutSextToSpeechInput
  }

  export type TextToSpeechUncheckedCreateInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    applicationRef: string
    productRef: string
  }

  export type TextToSpeechUpdateInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    application?: ApplicationUpdateOneRequiredWithoutTextToSpeechNestedInput
    product?: ProductUpdateOneRequiredWithoutSextToSpeechNestedInput
  }

  export type TextToSpeechUncheckedUpdateInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    applicationRef?: StringFieldUpdateOperationsInput | string
    productRef?: StringFieldUpdateOperationsInput | string
  }

  export type TextToSpeechCreateManyInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    applicationRef: string
    productRef: string
  }

  export type TextToSpeechUpdateManyMutationInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
  }

  export type TextToSpeechUncheckedUpdateManyInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    applicationRef?: StringFieldUpdateOperationsInput | string
    productRef?: StringFieldUpdateOperationsInput | string
  }

  export type SpeechToTextCreateInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    application: ApplicationCreateNestedOneWithoutSpeechToTextInput
    product: ProductCreateNestedOneWithoutSpeechToTextInput
  }

  export type SpeechToTextUncheckedCreateInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    applicationRef: string
    productRef: string
  }

  export type SpeechToTextUpdateInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    application?: ApplicationUpdateOneRequiredWithoutSpeechToTextNestedInput
    product?: ProductUpdateOneRequiredWithoutSpeechToTextNestedInput
  }

  export type SpeechToTextUncheckedUpdateInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    applicationRef?: StringFieldUpdateOperationsInput | string
    productRef?: StringFieldUpdateOperationsInput | string
  }

  export type SpeechToTextCreateManyInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    applicationRef: string
    productRef: string
  }

  export type SpeechToTextUpdateManyMutationInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
  }

  export type SpeechToTextUncheckedUpdateManyInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    applicationRef?: StringFieldUpdateOperationsInput | string
    productRef?: StringFieldUpdateOperationsInput | string
  }

  export type IntelligenceCreateInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    credentials: string
    application: ApplicationCreateNestedOneWithoutIntelligenceInput
    Product: ProductCreateNestedOneWithoutIntelligenceInput
  }

  export type IntelligenceUncheckedCreateInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    credentials: string
    applicationRef: string
    productRef: string
  }

  export type IntelligenceUpdateInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    credentials?: StringFieldUpdateOperationsInput | string
    application?: ApplicationUpdateOneRequiredWithoutIntelligenceNestedInput
    Product?: ProductUpdateOneRequiredWithoutIntelligenceNestedInput
  }

  export type IntelligenceUncheckedUpdateInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    credentials?: StringFieldUpdateOperationsInput | string
    applicationRef?: StringFieldUpdateOperationsInput | string
    productRef?: StringFieldUpdateOperationsInput | string
  }

  export type IntelligenceCreateManyInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    credentials: string
    applicationRef: string
    productRef: string
  }

  export type IntelligenceUpdateManyMutationInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    credentials?: StringFieldUpdateOperationsInput | string
  }

  export type IntelligenceUncheckedUpdateManyInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    credentials?: StringFieldUpdateOperationsInput | string
    applicationRef?: StringFieldUpdateOperationsInput | string
    productRef?: StringFieldUpdateOperationsInput | string
  }

  export type ProductCreateInput = {
    ref: string
    name: string
    vendor: $Enums.ProductVendor
    type: $Enums.ProductType
    speechToText?: SpeechToTextCreateNestedManyWithoutProductInput
    sextToSpeech?: TextToSpeechCreateNestedManyWithoutProductInput
    intelligence?: IntelligenceCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateInput = {
    ref: string
    name: string
    vendor: $Enums.ProductVendor
    type: $Enums.ProductType
    speechToText?: SpeechToTextUncheckedCreateNestedManyWithoutProductInput
    sextToSpeech?: TextToSpeechUncheckedCreateNestedManyWithoutProductInput
    intelligence?: IntelligenceUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductUpdateInput = {
    ref?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    vendor?: EnumProductVendorFieldUpdateOperationsInput | $Enums.ProductVendor
    type?: EnumProductTypeFieldUpdateOperationsInput | $Enums.ProductType
    speechToText?: SpeechToTextUpdateManyWithoutProductNestedInput
    sextToSpeech?: TextToSpeechUpdateManyWithoutProductNestedInput
    intelligence?: IntelligenceUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateInput = {
    ref?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    vendor?: EnumProductVendorFieldUpdateOperationsInput | $Enums.ProductVendor
    type?: EnumProductTypeFieldUpdateOperationsInput | $Enums.ProductType
    speechToText?: SpeechToTextUncheckedUpdateManyWithoutProductNestedInput
    sextToSpeech?: TextToSpeechUncheckedUpdateManyWithoutProductNestedInput
    intelligence?: IntelligenceUncheckedUpdateManyWithoutProductNestedInput
  }

  export type ProductCreateManyInput = {
    ref: string
    name: string
    vendor: $Enums.ProductVendor
    type: $Enums.ProductType
  }

  export type ProductUpdateManyMutationInput = {
    ref?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    vendor?: EnumProductVendorFieldUpdateOperationsInput | $Enums.ProductVendor
    type?: EnumProductTypeFieldUpdateOperationsInput | $Enums.ProductType
  }

  export type ProductUncheckedUpdateManyInput = {
    ref?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    vendor?: EnumProductVendorFieldUpdateOperationsInput | $Enums.ProductVendor
    type?: EnumProductTypeFieldUpdateOperationsInput | $Enums.ProductType
  }

  export type SecretCreateInput = {
    ref?: string
    accessKeyId: string
    name: string
    secret: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SecretUncheckedCreateInput = {
    ref?: string
    accessKeyId: string
    name: string
    secret: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SecretUpdateInput = {
    ref?: StringFieldUpdateOperationsInput | string
    accessKeyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    secret?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SecretUncheckedUpdateInput = {
    ref?: StringFieldUpdateOperationsInput | string
    accessKeyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    secret?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SecretCreateManyInput = {
    ref?: string
    accessKeyId: string
    name: string
    secret: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SecretUpdateManyMutationInput = {
    ref?: StringFieldUpdateOperationsInput | string
    accessKeyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    secret?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SecretUncheckedUpdateManyInput = {
    ref?: StringFieldUpdateOperationsInput | string
    accessKeyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    secret?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type EnumApplicationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ApplicationType | EnumApplicationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ApplicationType[] | ListEnumApplicationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ApplicationType[] | ListEnumApplicationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumApplicationTypeFilter<$PrismaModel> | $Enums.ApplicationType
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type TextToSpeechNullableScalarRelationFilter = {
    is?: TextToSpeechWhereInput | null
    isNot?: TextToSpeechWhereInput | null
  }

  export type SpeechToTextNullableScalarRelationFilter = {
    is?: SpeechToTextWhereInput | null
    isNot?: SpeechToTextWhereInput | null
  }

  export type IntelligenceNullableScalarRelationFilter = {
    is?: IntelligenceWhereInput | null
    isNot?: IntelligenceWhereInput | null
  }

  export type ApplicationCountOrderByAggregateInput = {
    ref?: SortOrder
    accessKeyId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    endpoint?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ApplicationMaxOrderByAggregateInput = {
    ref?: SortOrder
    accessKeyId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    endpoint?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ApplicationMinOrderByAggregateInput = {
    ref?: SortOrder
    accessKeyId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    endpoint?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type EnumApplicationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ApplicationType | EnumApplicationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ApplicationType[] | ListEnumApplicationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ApplicationType[] | ListEnumApplicationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumApplicationTypeWithAggregatesFilter<$PrismaModel> | $Enums.ApplicationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumApplicationTypeFilter<$PrismaModel>
    _max?: NestedEnumApplicationTypeFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type ApplicationScalarRelationFilter = {
    is?: ApplicationWhereInput
    isNot?: ApplicationWhereInput
  }

  export type ProductScalarRelationFilter = {
    is?: ProductWhereInput
    isNot?: ProductWhereInput
  }

  export type TextToSpeechCountOrderByAggregateInput = {
    ref?: SortOrder
    config?: SortOrder
    applicationRef?: SortOrder
    productRef?: SortOrder
  }

  export type TextToSpeechMaxOrderByAggregateInput = {
    ref?: SortOrder
    applicationRef?: SortOrder
    productRef?: SortOrder
  }

  export type TextToSpeechMinOrderByAggregateInput = {
    ref?: SortOrder
    applicationRef?: SortOrder
    productRef?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type SpeechToTextCountOrderByAggregateInput = {
    ref?: SortOrder
    config?: SortOrder
    applicationRef?: SortOrder
    productRef?: SortOrder
  }

  export type SpeechToTextMaxOrderByAggregateInput = {
    ref?: SortOrder
    applicationRef?: SortOrder
    productRef?: SortOrder
  }

  export type SpeechToTextMinOrderByAggregateInput = {
    ref?: SortOrder
    applicationRef?: SortOrder
    productRef?: SortOrder
  }

  export type IntelligenceCountOrderByAggregateInput = {
    ref?: SortOrder
    config?: SortOrder
    credentials?: SortOrder
    applicationRef?: SortOrder
    productRef?: SortOrder
  }

  export type IntelligenceMaxOrderByAggregateInput = {
    ref?: SortOrder
    credentials?: SortOrder
    applicationRef?: SortOrder
    productRef?: SortOrder
  }

  export type IntelligenceMinOrderByAggregateInput = {
    ref?: SortOrder
    credentials?: SortOrder
    applicationRef?: SortOrder
    productRef?: SortOrder
  }

  export type EnumProductVendorFilter<$PrismaModel = never> = {
    equals?: $Enums.ProductVendor | EnumProductVendorFieldRefInput<$PrismaModel>
    in?: $Enums.ProductVendor[] | ListEnumProductVendorFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProductVendor[] | ListEnumProductVendorFieldRefInput<$PrismaModel>
    not?: NestedEnumProductVendorFilter<$PrismaModel> | $Enums.ProductVendor
  }

  export type EnumProductTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ProductType | EnumProductTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProductType[] | ListEnumProductTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProductType[] | ListEnumProductTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProductTypeFilter<$PrismaModel> | $Enums.ProductType
  }

  export type SpeechToTextListRelationFilter = {
    every?: SpeechToTextWhereInput
    some?: SpeechToTextWhereInput
    none?: SpeechToTextWhereInput
  }

  export type TextToSpeechListRelationFilter = {
    every?: TextToSpeechWhereInput
    some?: TextToSpeechWhereInput
    none?: TextToSpeechWhereInput
  }

  export type IntelligenceListRelationFilter = {
    every?: IntelligenceWhereInput
    some?: IntelligenceWhereInput
    none?: IntelligenceWhereInput
  }

  export type SpeechToTextOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TextToSpeechOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type IntelligenceOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ProductCountOrderByAggregateInput = {
    ref?: SortOrder
    name?: SortOrder
    vendor?: SortOrder
    type?: SortOrder
  }

  export type ProductMaxOrderByAggregateInput = {
    ref?: SortOrder
    name?: SortOrder
    vendor?: SortOrder
    type?: SortOrder
  }

  export type ProductMinOrderByAggregateInput = {
    ref?: SortOrder
    name?: SortOrder
    vendor?: SortOrder
    type?: SortOrder
  }

  export type EnumProductVendorWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProductVendor | EnumProductVendorFieldRefInput<$PrismaModel>
    in?: $Enums.ProductVendor[] | ListEnumProductVendorFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProductVendor[] | ListEnumProductVendorFieldRefInput<$PrismaModel>
    not?: NestedEnumProductVendorWithAggregatesFilter<$PrismaModel> | $Enums.ProductVendor
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProductVendorFilter<$PrismaModel>
    _max?: NestedEnumProductVendorFilter<$PrismaModel>
  }

  export type EnumProductTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProductType | EnumProductTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProductType[] | ListEnumProductTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProductType[] | ListEnumProductTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProductTypeWithAggregatesFilter<$PrismaModel> | $Enums.ProductType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProductTypeFilter<$PrismaModel>
    _max?: NestedEnumProductTypeFilter<$PrismaModel>
  }

  export type SecretCountOrderByAggregateInput = {
    ref?: SortOrder
    accessKeyId?: SortOrder
    name?: SortOrder
    secret?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SecretMaxOrderByAggregateInput = {
    ref?: SortOrder
    accessKeyId?: SortOrder
    name?: SortOrder
    secret?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SecretMinOrderByAggregateInput = {
    ref?: SortOrder
    accessKeyId?: SortOrder
    name?: SortOrder
    secret?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TextToSpeechCreateNestedOneWithoutApplicationInput = {
    create?: XOR<TextToSpeechCreateWithoutApplicationInput, TextToSpeechUncheckedCreateWithoutApplicationInput>
    connectOrCreate?: TextToSpeechCreateOrConnectWithoutApplicationInput
    connect?: TextToSpeechWhereUniqueInput
  }

  export type SpeechToTextCreateNestedOneWithoutApplicationInput = {
    create?: XOR<SpeechToTextCreateWithoutApplicationInput, SpeechToTextUncheckedCreateWithoutApplicationInput>
    connectOrCreate?: SpeechToTextCreateOrConnectWithoutApplicationInput
    connect?: SpeechToTextWhereUniqueInput
  }

  export type IntelligenceCreateNestedOneWithoutApplicationInput = {
    create?: XOR<IntelligenceCreateWithoutApplicationInput, IntelligenceUncheckedCreateWithoutApplicationInput>
    connectOrCreate?: IntelligenceCreateOrConnectWithoutApplicationInput
    connect?: IntelligenceWhereUniqueInput
  }

  export type TextToSpeechUncheckedCreateNestedOneWithoutApplicationInput = {
    create?: XOR<TextToSpeechCreateWithoutApplicationInput, TextToSpeechUncheckedCreateWithoutApplicationInput>
    connectOrCreate?: TextToSpeechCreateOrConnectWithoutApplicationInput
    connect?: TextToSpeechWhereUniqueInput
  }

  export type SpeechToTextUncheckedCreateNestedOneWithoutApplicationInput = {
    create?: XOR<SpeechToTextCreateWithoutApplicationInput, SpeechToTextUncheckedCreateWithoutApplicationInput>
    connectOrCreate?: SpeechToTextCreateOrConnectWithoutApplicationInput
    connect?: SpeechToTextWhereUniqueInput
  }

  export type IntelligenceUncheckedCreateNestedOneWithoutApplicationInput = {
    create?: XOR<IntelligenceCreateWithoutApplicationInput, IntelligenceUncheckedCreateWithoutApplicationInput>
    connectOrCreate?: IntelligenceCreateOrConnectWithoutApplicationInput
    connect?: IntelligenceWhereUniqueInput
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumApplicationTypeFieldUpdateOperationsInput = {
    set?: $Enums.ApplicationType
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type TextToSpeechUpdateOneWithoutApplicationNestedInput = {
    create?: XOR<TextToSpeechCreateWithoutApplicationInput, TextToSpeechUncheckedCreateWithoutApplicationInput>
    connectOrCreate?: TextToSpeechCreateOrConnectWithoutApplicationInput
    upsert?: TextToSpeechUpsertWithoutApplicationInput
    disconnect?: TextToSpeechWhereInput | boolean
    delete?: TextToSpeechWhereInput | boolean
    connect?: TextToSpeechWhereUniqueInput
    update?: XOR<XOR<TextToSpeechUpdateToOneWithWhereWithoutApplicationInput, TextToSpeechUpdateWithoutApplicationInput>, TextToSpeechUncheckedUpdateWithoutApplicationInput>
  }

  export type SpeechToTextUpdateOneWithoutApplicationNestedInput = {
    create?: XOR<SpeechToTextCreateWithoutApplicationInput, SpeechToTextUncheckedCreateWithoutApplicationInput>
    connectOrCreate?: SpeechToTextCreateOrConnectWithoutApplicationInput
    upsert?: SpeechToTextUpsertWithoutApplicationInput
    disconnect?: SpeechToTextWhereInput | boolean
    delete?: SpeechToTextWhereInput | boolean
    connect?: SpeechToTextWhereUniqueInput
    update?: XOR<XOR<SpeechToTextUpdateToOneWithWhereWithoutApplicationInput, SpeechToTextUpdateWithoutApplicationInput>, SpeechToTextUncheckedUpdateWithoutApplicationInput>
  }

  export type IntelligenceUpdateOneWithoutApplicationNestedInput = {
    create?: XOR<IntelligenceCreateWithoutApplicationInput, IntelligenceUncheckedCreateWithoutApplicationInput>
    connectOrCreate?: IntelligenceCreateOrConnectWithoutApplicationInput
    upsert?: IntelligenceUpsertWithoutApplicationInput
    disconnect?: IntelligenceWhereInput | boolean
    delete?: IntelligenceWhereInput | boolean
    connect?: IntelligenceWhereUniqueInput
    update?: XOR<XOR<IntelligenceUpdateToOneWithWhereWithoutApplicationInput, IntelligenceUpdateWithoutApplicationInput>, IntelligenceUncheckedUpdateWithoutApplicationInput>
  }

  export type TextToSpeechUncheckedUpdateOneWithoutApplicationNestedInput = {
    create?: XOR<TextToSpeechCreateWithoutApplicationInput, TextToSpeechUncheckedCreateWithoutApplicationInput>
    connectOrCreate?: TextToSpeechCreateOrConnectWithoutApplicationInput
    upsert?: TextToSpeechUpsertWithoutApplicationInput
    disconnect?: TextToSpeechWhereInput | boolean
    delete?: TextToSpeechWhereInput | boolean
    connect?: TextToSpeechWhereUniqueInput
    update?: XOR<XOR<TextToSpeechUpdateToOneWithWhereWithoutApplicationInput, TextToSpeechUpdateWithoutApplicationInput>, TextToSpeechUncheckedUpdateWithoutApplicationInput>
  }

  export type SpeechToTextUncheckedUpdateOneWithoutApplicationNestedInput = {
    create?: XOR<SpeechToTextCreateWithoutApplicationInput, SpeechToTextUncheckedCreateWithoutApplicationInput>
    connectOrCreate?: SpeechToTextCreateOrConnectWithoutApplicationInput
    upsert?: SpeechToTextUpsertWithoutApplicationInput
    disconnect?: SpeechToTextWhereInput | boolean
    delete?: SpeechToTextWhereInput | boolean
    connect?: SpeechToTextWhereUniqueInput
    update?: XOR<XOR<SpeechToTextUpdateToOneWithWhereWithoutApplicationInput, SpeechToTextUpdateWithoutApplicationInput>, SpeechToTextUncheckedUpdateWithoutApplicationInput>
  }

  export type IntelligenceUncheckedUpdateOneWithoutApplicationNestedInput = {
    create?: XOR<IntelligenceCreateWithoutApplicationInput, IntelligenceUncheckedCreateWithoutApplicationInput>
    connectOrCreate?: IntelligenceCreateOrConnectWithoutApplicationInput
    upsert?: IntelligenceUpsertWithoutApplicationInput
    disconnect?: IntelligenceWhereInput | boolean
    delete?: IntelligenceWhereInput | boolean
    connect?: IntelligenceWhereUniqueInput
    update?: XOR<XOR<IntelligenceUpdateToOneWithWhereWithoutApplicationInput, IntelligenceUpdateWithoutApplicationInput>, IntelligenceUncheckedUpdateWithoutApplicationInput>
  }

  export type ApplicationCreateNestedOneWithoutTextToSpeechInput = {
    create?: XOR<ApplicationCreateWithoutTextToSpeechInput, ApplicationUncheckedCreateWithoutTextToSpeechInput>
    connectOrCreate?: ApplicationCreateOrConnectWithoutTextToSpeechInput
    connect?: ApplicationWhereUniqueInput
  }

  export type ProductCreateNestedOneWithoutSextToSpeechInput = {
    create?: XOR<ProductCreateWithoutSextToSpeechInput, ProductUncheckedCreateWithoutSextToSpeechInput>
    connectOrCreate?: ProductCreateOrConnectWithoutSextToSpeechInput
    connect?: ProductWhereUniqueInput
  }

  export type ApplicationUpdateOneRequiredWithoutTextToSpeechNestedInput = {
    create?: XOR<ApplicationCreateWithoutTextToSpeechInput, ApplicationUncheckedCreateWithoutTextToSpeechInput>
    connectOrCreate?: ApplicationCreateOrConnectWithoutTextToSpeechInput
    upsert?: ApplicationUpsertWithoutTextToSpeechInput
    connect?: ApplicationWhereUniqueInput
    update?: XOR<XOR<ApplicationUpdateToOneWithWhereWithoutTextToSpeechInput, ApplicationUpdateWithoutTextToSpeechInput>, ApplicationUncheckedUpdateWithoutTextToSpeechInput>
  }

  export type ProductUpdateOneRequiredWithoutSextToSpeechNestedInput = {
    create?: XOR<ProductCreateWithoutSextToSpeechInput, ProductUncheckedCreateWithoutSextToSpeechInput>
    connectOrCreate?: ProductCreateOrConnectWithoutSextToSpeechInput
    upsert?: ProductUpsertWithoutSextToSpeechInput
    connect?: ProductWhereUniqueInput
    update?: XOR<XOR<ProductUpdateToOneWithWhereWithoutSextToSpeechInput, ProductUpdateWithoutSextToSpeechInput>, ProductUncheckedUpdateWithoutSextToSpeechInput>
  }

  export type ApplicationCreateNestedOneWithoutSpeechToTextInput = {
    create?: XOR<ApplicationCreateWithoutSpeechToTextInput, ApplicationUncheckedCreateWithoutSpeechToTextInput>
    connectOrCreate?: ApplicationCreateOrConnectWithoutSpeechToTextInput
    connect?: ApplicationWhereUniqueInput
  }

  export type ProductCreateNestedOneWithoutSpeechToTextInput = {
    create?: XOR<ProductCreateWithoutSpeechToTextInput, ProductUncheckedCreateWithoutSpeechToTextInput>
    connectOrCreate?: ProductCreateOrConnectWithoutSpeechToTextInput
    connect?: ProductWhereUniqueInput
  }

  export type ApplicationUpdateOneRequiredWithoutSpeechToTextNestedInput = {
    create?: XOR<ApplicationCreateWithoutSpeechToTextInput, ApplicationUncheckedCreateWithoutSpeechToTextInput>
    connectOrCreate?: ApplicationCreateOrConnectWithoutSpeechToTextInput
    upsert?: ApplicationUpsertWithoutSpeechToTextInput
    connect?: ApplicationWhereUniqueInput
    update?: XOR<XOR<ApplicationUpdateToOneWithWhereWithoutSpeechToTextInput, ApplicationUpdateWithoutSpeechToTextInput>, ApplicationUncheckedUpdateWithoutSpeechToTextInput>
  }

  export type ProductUpdateOneRequiredWithoutSpeechToTextNestedInput = {
    create?: XOR<ProductCreateWithoutSpeechToTextInput, ProductUncheckedCreateWithoutSpeechToTextInput>
    connectOrCreate?: ProductCreateOrConnectWithoutSpeechToTextInput
    upsert?: ProductUpsertWithoutSpeechToTextInput
    connect?: ProductWhereUniqueInput
    update?: XOR<XOR<ProductUpdateToOneWithWhereWithoutSpeechToTextInput, ProductUpdateWithoutSpeechToTextInput>, ProductUncheckedUpdateWithoutSpeechToTextInput>
  }

  export type ApplicationCreateNestedOneWithoutIntelligenceInput = {
    create?: XOR<ApplicationCreateWithoutIntelligenceInput, ApplicationUncheckedCreateWithoutIntelligenceInput>
    connectOrCreate?: ApplicationCreateOrConnectWithoutIntelligenceInput
    connect?: ApplicationWhereUniqueInput
  }

  export type ProductCreateNestedOneWithoutIntelligenceInput = {
    create?: XOR<ProductCreateWithoutIntelligenceInput, ProductUncheckedCreateWithoutIntelligenceInput>
    connectOrCreate?: ProductCreateOrConnectWithoutIntelligenceInput
    connect?: ProductWhereUniqueInput
  }

  export type ApplicationUpdateOneRequiredWithoutIntelligenceNestedInput = {
    create?: XOR<ApplicationCreateWithoutIntelligenceInput, ApplicationUncheckedCreateWithoutIntelligenceInput>
    connectOrCreate?: ApplicationCreateOrConnectWithoutIntelligenceInput
    upsert?: ApplicationUpsertWithoutIntelligenceInput
    connect?: ApplicationWhereUniqueInput
    update?: XOR<XOR<ApplicationUpdateToOneWithWhereWithoutIntelligenceInput, ApplicationUpdateWithoutIntelligenceInput>, ApplicationUncheckedUpdateWithoutIntelligenceInput>
  }

  export type ProductUpdateOneRequiredWithoutIntelligenceNestedInput = {
    create?: XOR<ProductCreateWithoutIntelligenceInput, ProductUncheckedCreateWithoutIntelligenceInput>
    connectOrCreate?: ProductCreateOrConnectWithoutIntelligenceInput
    upsert?: ProductUpsertWithoutIntelligenceInput
    connect?: ProductWhereUniqueInput
    update?: XOR<XOR<ProductUpdateToOneWithWhereWithoutIntelligenceInput, ProductUpdateWithoutIntelligenceInput>, ProductUncheckedUpdateWithoutIntelligenceInput>
  }

  export type SpeechToTextCreateNestedManyWithoutProductInput = {
    create?: XOR<SpeechToTextCreateWithoutProductInput, SpeechToTextUncheckedCreateWithoutProductInput> | SpeechToTextCreateWithoutProductInput[] | SpeechToTextUncheckedCreateWithoutProductInput[]
    connectOrCreate?: SpeechToTextCreateOrConnectWithoutProductInput | SpeechToTextCreateOrConnectWithoutProductInput[]
    createMany?: SpeechToTextCreateManyProductInputEnvelope
    connect?: SpeechToTextWhereUniqueInput | SpeechToTextWhereUniqueInput[]
  }

  export type TextToSpeechCreateNestedManyWithoutProductInput = {
    create?: XOR<TextToSpeechCreateWithoutProductInput, TextToSpeechUncheckedCreateWithoutProductInput> | TextToSpeechCreateWithoutProductInput[] | TextToSpeechUncheckedCreateWithoutProductInput[]
    connectOrCreate?: TextToSpeechCreateOrConnectWithoutProductInput | TextToSpeechCreateOrConnectWithoutProductInput[]
    createMany?: TextToSpeechCreateManyProductInputEnvelope
    connect?: TextToSpeechWhereUniqueInput | TextToSpeechWhereUniqueInput[]
  }

  export type IntelligenceCreateNestedManyWithoutProductInput = {
    create?: XOR<IntelligenceCreateWithoutProductInput, IntelligenceUncheckedCreateWithoutProductInput> | IntelligenceCreateWithoutProductInput[] | IntelligenceUncheckedCreateWithoutProductInput[]
    connectOrCreate?: IntelligenceCreateOrConnectWithoutProductInput | IntelligenceCreateOrConnectWithoutProductInput[]
    createMany?: IntelligenceCreateManyProductInputEnvelope
    connect?: IntelligenceWhereUniqueInput | IntelligenceWhereUniqueInput[]
  }

  export type SpeechToTextUncheckedCreateNestedManyWithoutProductInput = {
    create?: XOR<SpeechToTextCreateWithoutProductInput, SpeechToTextUncheckedCreateWithoutProductInput> | SpeechToTextCreateWithoutProductInput[] | SpeechToTextUncheckedCreateWithoutProductInput[]
    connectOrCreate?: SpeechToTextCreateOrConnectWithoutProductInput | SpeechToTextCreateOrConnectWithoutProductInput[]
    createMany?: SpeechToTextCreateManyProductInputEnvelope
    connect?: SpeechToTextWhereUniqueInput | SpeechToTextWhereUniqueInput[]
  }

  export type TextToSpeechUncheckedCreateNestedManyWithoutProductInput = {
    create?: XOR<TextToSpeechCreateWithoutProductInput, TextToSpeechUncheckedCreateWithoutProductInput> | TextToSpeechCreateWithoutProductInput[] | TextToSpeechUncheckedCreateWithoutProductInput[]
    connectOrCreate?: TextToSpeechCreateOrConnectWithoutProductInput | TextToSpeechCreateOrConnectWithoutProductInput[]
    createMany?: TextToSpeechCreateManyProductInputEnvelope
    connect?: TextToSpeechWhereUniqueInput | TextToSpeechWhereUniqueInput[]
  }

  export type IntelligenceUncheckedCreateNestedManyWithoutProductInput = {
    create?: XOR<IntelligenceCreateWithoutProductInput, IntelligenceUncheckedCreateWithoutProductInput> | IntelligenceCreateWithoutProductInput[] | IntelligenceUncheckedCreateWithoutProductInput[]
    connectOrCreate?: IntelligenceCreateOrConnectWithoutProductInput | IntelligenceCreateOrConnectWithoutProductInput[]
    createMany?: IntelligenceCreateManyProductInputEnvelope
    connect?: IntelligenceWhereUniqueInput | IntelligenceWhereUniqueInput[]
  }

  export type EnumProductVendorFieldUpdateOperationsInput = {
    set?: $Enums.ProductVendor
  }

  export type EnumProductTypeFieldUpdateOperationsInput = {
    set?: $Enums.ProductType
  }

  export type SpeechToTextUpdateManyWithoutProductNestedInput = {
    create?: XOR<SpeechToTextCreateWithoutProductInput, SpeechToTextUncheckedCreateWithoutProductInput> | SpeechToTextCreateWithoutProductInput[] | SpeechToTextUncheckedCreateWithoutProductInput[]
    connectOrCreate?: SpeechToTextCreateOrConnectWithoutProductInput | SpeechToTextCreateOrConnectWithoutProductInput[]
    upsert?: SpeechToTextUpsertWithWhereUniqueWithoutProductInput | SpeechToTextUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: SpeechToTextCreateManyProductInputEnvelope
    set?: SpeechToTextWhereUniqueInput | SpeechToTextWhereUniqueInput[]
    disconnect?: SpeechToTextWhereUniqueInput | SpeechToTextWhereUniqueInput[]
    delete?: SpeechToTextWhereUniqueInput | SpeechToTextWhereUniqueInput[]
    connect?: SpeechToTextWhereUniqueInput | SpeechToTextWhereUniqueInput[]
    update?: SpeechToTextUpdateWithWhereUniqueWithoutProductInput | SpeechToTextUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: SpeechToTextUpdateManyWithWhereWithoutProductInput | SpeechToTextUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: SpeechToTextScalarWhereInput | SpeechToTextScalarWhereInput[]
  }

  export type TextToSpeechUpdateManyWithoutProductNestedInput = {
    create?: XOR<TextToSpeechCreateWithoutProductInput, TextToSpeechUncheckedCreateWithoutProductInput> | TextToSpeechCreateWithoutProductInput[] | TextToSpeechUncheckedCreateWithoutProductInput[]
    connectOrCreate?: TextToSpeechCreateOrConnectWithoutProductInput | TextToSpeechCreateOrConnectWithoutProductInput[]
    upsert?: TextToSpeechUpsertWithWhereUniqueWithoutProductInput | TextToSpeechUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: TextToSpeechCreateManyProductInputEnvelope
    set?: TextToSpeechWhereUniqueInput | TextToSpeechWhereUniqueInput[]
    disconnect?: TextToSpeechWhereUniqueInput | TextToSpeechWhereUniqueInput[]
    delete?: TextToSpeechWhereUniqueInput | TextToSpeechWhereUniqueInput[]
    connect?: TextToSpeechWhereUniqueInput | TextToSpeechWhereUniqueInput[]
    update?: TextToSpeechUpdateWithWhereUniqueWithoutProductInput | TextToSpeechUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: TextToSpeechUpdateManyWithWhereWithoutProductInput | TextToSpeechUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: TextToSpeechScalarWhereInput | TextToSpeechScalarWhereInput[]
  }

  export type IntelligenceUpdateManyWithoutProductNestedInput = {
    create?: XOR<IntelligenceCreateWithoutProductInput, IntelligenceUncheckedCreateWithoutProductInput> | IntelligenceCreateWithoutProductInput[] | IntelligenceUncheckedCreateWithoutProductInput[]
    connectOrCreate?: IntelligenceCreateOrConnectWithoutProductInput | IntelligenceCreateOrConnectWithoutProductInput[]
    upsert?: IntelligenceUpsertWithWhereUniqueWithoutProductInput | IntelligenceUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: IntelligenceCreateManyProductInputEnvelope
    set?: IntelligenceWhereUniqueInput | IntelligenceWhereUniqueInput[]
    disconnect?: IntelligenceWhereUniqueInput | IntelligenceWhereUniqueInput[]
    delete?: IntelligenceWhereUniqueInput | IntelligenceWhereUniqueInput[]
    connect?: IntelligenceWhereUniqueInput | IntelligenceWhereUniqueInput[]
    update?: IntelligenceUpdateWithWhereUniqueWithoutProductInput | IntelligenceUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: IntelligenceUpdateManyWithWhereWithoutProductInput | IntelligenceUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: IntelligenceScalarWhereInput | IntelligenceScalarWhereInput[]
  }

  export type SpeechToTextUncheckedUpdateManyWithoutProductNestedInput = {
    create?: XOR<SpeechToTextCreateWithoutProductInput, SpeechToTextUncheckedCreateWithoutProductInput> | SpeechToTextCreateWithoutProductInput[] | SpeechToTextUncheckedCreateWithoutProductInput[]
    connectOrCreate?: SpeechToTextCreateOrConnectWithoutProductInput | SpeechToTextCreateOrConnectWithoutProductInput[]
    upsert?: SpeechToTextUpsertWithWhereUniqueWithoutProductInput | SpeechToTextUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: SpeechToTextCreateManyProductInputEnvelope
    set?: SpeechToTextWhereUniqueInput | SpeechToTextWhereUniqueInput[]
    disconnect?: SpeechToTextWhereUniqueInput | SpeechToTextWhereUniqueInput[]
    delete?: SpeechToTextWhereUniqueInput | SpeechToTextWhereUniqueInput[]
    connect?: SpeechToTextWhereUniqueInput | SpeechToTextWhereUniqueInput[]
    update?: SpeechToTextUpdateWithWhereUniqueWithoutProductInput | SpeechToTextUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: SpeechToTextUpdateManyWithWhereWithoutProductInput | SpeechToTextUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: SpeechToTextScalarWhereInput | SpeechToTextScalarWhereInput[]
  }

  export type TextToSpeechUncheckedUpdateManyWithoutProductNestedInput = {
    create?: XOR<TextToSpeechCreateWithoutProductInput, TextToSpeechUncheckedCreateWithoutProductInput> | TextToSpeechCreateWithoutProductInput[] | TextToSpeechUncheckedCreateWithoutProductInput[]
    connectOrCreate?: TextToSpeechCreateOrConnectWithoutProductInput | TextToSpeechCreateOrConnectWithoutProductInput[]
    upsert?: TextToSpeechUpsertWithWhereUniqueWithoutProductInput | TextToSpeechUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: TextToSpeechCreateManyProductInputEnvelope
    set?: TextToSpeechWhereUniqueInput | TextToSpeechWhereUniqueInput[]
    disconnect?: TextToSpeechWhereUniqueInput | TextToSpeechWhereUniqueInput[]
    delete?: TextToSpeechWhereUniqueInput | TextToSpeechWhereUniqueInput[]
    connect?: TextToSpeechWhereUniqueInput | TextToSpeechWhereUniqueInput[]
    update?: TextToSpeechUpdateWithWhereUniqueWithoutProductInput | TextToSpeechUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: TextToSpeechUpdateManyWithWhereWithoutProductInput | TextToSpeechUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: TextToSpeechScalarWhereInput | TextToSpeechScalarWhereInput[]
  }

  export type IntelligenceUncheckedUpdateManyWithoutProductNestedInput = {
    create?: XOR<IntelligenceCreateWithoutProductInput, IntelligenceUncheckedCreateWithoutProductInput> | IntelligenceCreateWithoutProductInput[] | IntelligenceUncheckedCreateWithoutProductInput[]
    connectOrCreate?: IntelligenceCreateOrConnectWithoutProductInput | IntelligenceCreateOrConnectWithoutProductInput[]
    upsert?: IntelligenceUpsertWithWhereUniqueWithoutProductInput | IntelligenceUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: IntelligenceCreateManyProductInputEnvelope
    set?: IntelligenceWhereUniqueInput | IntelligenceWhereUniqueInput[]
    disconnect?: IntelligenceWhereUniqueInput | IntelligenceWhereUniqueInput[]
    delete?: IntelligenceWhereUniqueInput | IntelligenceWhereUniqueInput[]
    connect?: IntelligenceWhereUniqueInput | IntelligenceWhereUniqueInput[]
    update?: IntelligenceUpdateWithWhereUniqueWithoutProductInput | IntelligenceUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: IntelligenceUpdateManyWithWhereWithoutProductInput | IntelligenceUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: IntelligenceScalarWhereInput | IntelligenceScalarWhereInput[]
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedEnumApplicationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ApplicationType | EnumApplicationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ApplicationType[] | ListEnumApplicationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ApplicationType[] | ListEnumApplicationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumApplicationTypeFilter<$PrismaModel> | $Enums.ApplicationType
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedEnumApplicationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ApplicationType | EnumApplicationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ApplicationType[] | ListEnumApplicationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ApplicationType[] | ListEnumApplicationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumApplicationTypeWithAggregatesFilter<$PrismaModel> | $Enums.ApplicationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumApplicationTypeFilter<$PrismaModel>
    _max?: NestedEnumApplicationTypeFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumProductVendorFilter<$PrismaModel = never> = {
    equals?: $Enums.ProductVendor | EnumProductVendorFieldRefInput<$PrismaModel>
    in?: $Enums.ProductVendor[] | ListEnumProductVendorFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProductVendor[] | ListEnumProductVendorFieldRefInput<$PrismaModel>
    not?: NestedEnumProductVendorFilter<$PrismaModel> | $Enums.ProductVendor
  }

  export type NestedEnumProductTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ProductType | EnumProductTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProductType[] | ListEnumProductTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProductType[] | ListEnumProductTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProductTypeFilter<$PrismaModel> | $Enums.ProductType
  }

  export type NestedEnumProductVendorWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProductVendor | EnumProductVendorFieldRefInput<$PrismaModel>
    in?: $Enums.ProductVendor[] | ListEnumProductVendorFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProductVendor[] | ListEnumProductVendorFieldRefInput<$PrismaModel>
    not?: NestedEnumProductVendorWithAggregatesFilter<$PrismaModel> | $Enums.ProductVendor
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProductVendorFilter<$PrismaModel>
    _max?: NestedEnumProductVendorFilter<$PrismaModel>
  }

  export type NestedEnumProductTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProductType | EnumProductTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProductType[] | ListEnumProductTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProductType[] | ListEnumProductTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProductTypeWithAggregatesFilter<$PrismaModel> | $Enums.ProductType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProductTypeFilter<$PrismaModel>
    _max?: NestedEnumProductTypeFilter<$PrismaModel>
  }

  export type TextToSpeechCreateWithoutApplicationInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    product: ProductCreateNestedOneWithoutSextToSpeechInput
  }

  export type TextToSpeechUncheckedCreateWithoutApplicationInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    productRef: string
  }

  export type TextToSpeechCreateOrConnectWithoutApplicationInput = {
    where: TextToSpeechWhereUniqueInput
    create: XOR<TextToSpeechCreateWithoutApplicationInput, TextToSpeechUncheckedCreateWithoutApplicationInput>
  }

  export type SpeechToTextCreateWithoutApplicationInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    product: ProductCreateNestedOneWithoutSpeechToTextInput
  }

  export type SpeechToTextUncheckedCreateWithoutApplicationInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    productRef: string
  }

  export type SpeechToTextCreateOrConnectWithoutApplicationInput = {
    where: SpeechToTextWhereUniqueInput
    create: XOR<SpeechToTextCreateWithoutApplicationInput, SpeechToTextUncheckedCreateWithoutApplicationInput>
  }

  export type IntelligenceCreateWithoutApplicationInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    credentials: string
    Product: ProductCreateNestedOneWithoutIntelligenceInput
  }

  export type IntelligenceUncheckedCreateWithoutApplicationInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    credentials: string
    productRef: string
  }

  export type IntelligenceCreateOrConnectWithoutApplicationInput = {
    where: IntelligenceWhereUniqueInput
    create: XOR<IntelligenceCreateWithoutApplicationInput, IntelligenceUncheckedCreateWithoutApplicationInput>
  }

  export type TextToSpeechUpsertWithoutApplicationInput = {
    update: XOR<TextToSpeechUpdateWithoutApplicationInput, TextToSpeechUncheckedUpdateWithoutApplicationInput>
    create: XOR<TextToSpeechCreateWithoutApplicationInput, TextToSpeechUncheckedCreateWithoutApplicationInput>
    where?: TextToSpeechWhereInput
  }

  export type TextToSpeechUpdateToOneWithWhereWithoutApplicationInput = {
    where?: TextToSpeechWhereInput
    data: XOR<TextToSpeechUpdateWithoutApplicationInput, TextToSpeechUncheckedUpdateWithoutApplicationInput>
  }

  export type TextToSpeechUpdateWithoutApplicationInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    product?: ProductUpdateOneRequiredWithoutSextToSpeechNestedInput
  }

  export type TextToSpeechUncheckedUpdateWithoutApplicationInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    productRef?: StringFieldUpdateOperationsInput | string
  }

  export type SpeechToTextUpsertWithoutApplicationInput = {
    update: XOR<SpeechToTextUpdateWithoutApplicationInput, SpeechToTextUncheckedUpdateWithoutApplicationInput>
    create: XOR<SpeechToTextCreateWithoutApplicationInput, SpeechToTextUncheckedCreateWithoutApplicationInput>
    where?: SpeechToTextWhereInput
  }

  export type SpeechToTextUpdateToOneWithWhereWithoutApplicationInput = {
    where?: SpeechToTextWhereInput
    data: XOR<SpeechToTextUpdateWithoutApplicationInput, SpeechToTextUncheckedUpdateWithoutApplicationInput>
  }

  export type SpeechToTextUpdateWithoutApplicationInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    product?: ProductUpdateOneRequiredWithoutSpeechToTextNestedInput
  }

  export type SpeechToTextUncheckedUpdateWithoutApplicationInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    productRef?: StringFieldUpdateOperationsInput | string
  }

  export type IntelligenceUpsertWithoutApplicationInput = {
    update: XOR<IntelligenceUpdateWithoutApplicationInput, IntelligenceUncheckedUpdateWithoutApplicationInput>
    create: XOR<IntelligenceCreateWithoutApplicationInput, IntelligenceUncheckedCreateWithoutApplicationInput>
    where?: IntelligenceWhereInput
  }

  export type IntelligenceUpdateToOneWithWhereWithoutApplicationInput = {
    where?: IntelligenceWhereInput
    data: XOR<IntelligenceUpdateWithoutApplicationInput, IntelligenceUncheckedUpdateWithoutApplicationInput>
  }

  export type IntelligenceUpdateWithoutApplicationInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    credentials?: StringFieldUpdateOperationsInput | string
    Product?: ProductUpdateOneRequiredWithoutIntelligenceNestedInput
  }

  export type IntelligenceUncheckedUpdateWithoutApplicationInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    credentials?: StringFieldUpdateOperationsInput | string
    productRef?: StringFieldUpdateOperationsInput | string
  }

  export type ApplicationCreateWithoutTextToSpeechInput = {
    ref?: string
    accessKeyId: string
    name: string
    type: $Enums.ApplicationType
    endpoint: string
    createdAt?: Date | string
    updatedAt?: Date | string
    speechToText?: SpeechToTextCreateNestedOneWithoutApplicationInput
    intelligence?: IntelligenceCreateNestedOneWithoutApplicationInput
  }

  export type ApplicationUncheckedCreateWithoutTextToSpeechInput = {
    ref?: string
    accessKeyId: string
    name: string
    type: $Enums.ApplicationType
    endpoint: string
    createdAt?: Date | string
    updatedAt?: Date | string
    speechToText?: SpeechToTextUncheckedCreateNestedOneWithoutApplicationInput
    intelligence?: IntelligenceUncheckedCreateNestedOneWithoutApplicationInput
  }

  export type ApplicationCreateOrConnectWithoutTextToSpeechInput = {
    where: ApplicationWhereUniqueInput
    create: XOR<ApplicationCreateWithoutTextToSpeechInput, ApplicationUncheckedCreateWithoutTextToSpeechInput>
  }

  export type ProductCreateWithoutSextToSpeechInput = {
    ref: string
    name: string
    vendor: $Enums.ProductVendor
    type: $Enums.ProductType
    speechToText?: SpeechToTextCreateNestedManyWithoutProductInput
    intelligence?: IntelligenceCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateWithoutSextToSpeechInput = {
    ref: string
    name: string
    vendor: $Enums.ProductVendor
    type: $Enums.ProductType
    speechToText?: SpeechToTextUncheckedCreateNestedManyWithoutProductInput
    intelligence?: IntelligenceUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductCreateOrConnectWithoutSextToSpeechInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutSextToSpeechInput, ProductUncheckedCreateWithoutSextToSpeechInput>
  }

  export type ApplicationUpsertWithoutTextToSpeechInput = {
    update: XOR<ApplicationUpdateWithoutTextToSpeechInput, ApplicationUncheckedUpdateWithoutTextToSpeechInput>
    create: XOR<ApplicationCreateWithoutTextToSpeechInput, ApplicationUncheckedCreateWithoutTextToSpeechInput>
    where?: ApplicationWhereInput
  }

  export type ApplicationUpdateToOneWithWhereWithoutTextToSpeechInput = {
    where?: ApplicationWhereInput
    data: XOR<ApplicationUpdateWithoutTextToSpeechInput, ApplicationUncheckedUpdateWithoutTextToSpeechInput>
  }

  export type ApplicationUpdateWithoutTextToSpeechInput = {
    ref?: StringFieldUpdateOperationsInput | string
    accessKeyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumApplicationTypeFieldUpdateOperationsInput | $Enums.ApplicationType
    endpoint?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    speechToText?: SpeechToTextUpdateOneWithoutApplicationNestedInput
    intelligence?: IntelligenceUpdateOneWithoutApplicationNestedInput
  }

  export type ApplicationUncheckedUpdateWithoutTextToSpeechInput = {
    ref?: StringFieldUpdateOperationsInput | string
    accessKeyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumApplicationTypeFieldUpdateOperationsInput | $Enums.ApplicationType
    endpoint?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    speechToText?: SpeechToTextUncheckedUpdateOneWithoutApplicationNestedInput
    intelligence?: IntelligenceUncheckedUpdateOneWithoutApplicationNestedInput
  }

  export type ProductUpsertWithoutSextToSpeechInput = {
    update: XOR<ProductUpdateWithoutSextToSpeechInput, ProductUncheckedUpdateWithoutSextToSpeechInput>
    create: XOR<ProductCreateWithoutSextToSpeechInput, ProductUncheckedCreateWithoutSextToSpeechInput>
    where?: ProductWhereInput
  }

  export type ProductUpdateToOneWithWhereWithoutSextToSpeechInput = {
    where?: ProductWhereInput
    data: XOR<ProductUpdateWithoutSextToSpeechInput, ProductUncheckedUpdateWithoutSextToSpeechInput>
  }

  export type ProductUpdateWithoutSextToSpeechInput = {
    ref?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    vendor?: EnumProductVendorFieldUpdateOperationsInput | $Enums.ProductVendor
    type?: EnumProductTypeFieldUpdateOperationsInput | $Enums.ProductType
    speechToText?: SpeechToTextUpdateManyWithoutProductNestedInput
    intelligence?: IntelligenceUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateWithoutSextToSpeechInput = {
    ref?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    vendor?: EnumProductVendorFieldUpdateOperationsInput | $Enums.ProductVendor
    type?: EnumProductTypeFieldUpdateOperationsInput | $Enums.ProductType
    speechToText?: SpeechToTextUncheckedUpdateManyWithoutProductNestedInput
    intelligence?: IntelligenceUncheckedUpdateManyWithoutProductNestedInput
  }

  export type ApplicationCreateWithoutSpeechToTextInput = {
    ref?: string
    accessKeyId: string
    name: string
    type: $Enums.ApplicationType
    endpoint: string
    createdAt?: Date | string
    updatedAt?: Date | string
    textToSpeech?: TextToSpeechCreateNestedOneWithoutApplicationInput
    intelligence?: IntelligenceCreateNestedOneWithoutApplicationInput
  }

  export type ApplicationUncheckedCreateWithoutSpeechToTextInput = {
    ref?: string
    accessKeyId: string
    name: string
    type: $Enums.ApplicationType
    endpoint: string
    createdAt?: Date | string
    updatedAt?: Date | string
    textToSpeech?: TextToSpeechUncheckedCreateNestedOneWithoutApplicationInput
    intelligence?: IntelligenceUncheckedCreateNestedOneWithoutApplicationInput
  }

  export type ApplicationCreateOrConnectWithoutSpeechToTextInput = {
    where: ApplicationWhereUniqueInput
    create: XOR<ApplicationCreateWithoutSpeechToTextInput, ApplicationUncheckedCreateWithoutSpeechToTextInput>
  }

  export type ProductCreateWithoutSpeechToTextInput = {
    ref: string
    name: string
    vendor: $Enums.ProductVendor
    type: $Enums.ProductType
    sextToSpeech?: TextToSpeechCreateNestedManyWithoutProductInput
    intelligence?: IntelligenceCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateWithoutSpeechToTextInput = {
    ref: string
    name: string
    vendor: $Enums.ProductVendor
    type: $Enums.ProductType
    sextToSpeech?: TextToSpeechUncheckedCreateNestedManyWithoutProductInput
    intelligence?: IntelligenceUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductCreateOrConnectWithoutSpeechToTextInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutSpeechToTextInput, ProductUncheckedCreateWithoutSpeechToTextInput>
  }

  export type ApplicationUpsertWithoutSpeechToTextInput = {
    update: XOR<ApplicationUpdateWithoutSpeechToTextInput, ApplicationUncheckedUpdateWithoutSpeechToTextInput>
    create: XOR<ApplicationCreateWithoutSpeechToTextInput, ApplicationUncheckedCreateWithoutSpeechToTextInput>
    where?: ApplicationWhereInput
  }

  export type ApplicationUpdateToOneWithWhereWithoutSpeechToTextInput = {
    where?: ApplicationWhereInput
    data: XOR<ApplicationUpdateWithoutSpeechToTextInput, ApplicationUncheckedUpdateWithoutSpeechToTextInput>
  }

  export type ApplicationUpdateWithoutSpeechToTextInput = {
    ref?: StringFieldUpdateOperationsInput | string
    accessKeyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumApplicationTypeFieldUpdateOperationsInput | $Enums.ApplicationType
    endpoint?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    textToSpeech?: TextToSpeechUpdateOneWithoutApplicationNestedInput
    intelligence?: IntelligenceUpdateOneWithoutApplicationNestedInput
  }

  export type ApplicationUncheckedUpdateWithoutSpeechToTextInput = {
    ref?: StringFieldUpdateOperationsInput | string
    accessKeyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumApplicationTypeFieldUpdateOperationsInput | $Enums.ApplicationType
    endpoint?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    textToSpeech?: TextToSpeechUncheckedUpdateOneWithoutApplicationNestedInput
    intelligence?: IntelligenceUncheckedUpdateOneWithoutApplicationNestedInput
  }

  export type ProductUpsertWithoutSpeechToTextInput = {
    update: XOR<ProductUpdateWithoutSpeechToTextInput, ProductUncheckedUpdateWithoutSpeechToTextInput>
    create: XOR<ProductCreateWithoutSpeechToTextInput, ProductUncheckedCreateWithoutSpeechToTextInput>
    where?: ProductWhereInput
  }

  export type ProductUpdateToOneWithWhereWithoutSpeechToTextInput = {
    where?: ProductWhereInput
    data: XOR<ProductUpdateWithoutSpeechToTextInput, ProductUncheckedUpdateWithoutSpeechToTextInput>
  }

  export type ProductUpdateWithoutSpeechToTextInput = {
    ref?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    vendor?: EnumProductVendorFieldUpdateOperationsInput | $Enums.ProductVendor
    type?: EnumProductTypeFieldUpdateOperationsInput | $Enums.ProductType
    sextToSpeech?: TextToSpeechUpdateManyWithoutProductNestedInput
    intelligence?: IntelligenceUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateWithoutSpeechToTextInput = {
    ref?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    vendor?: EnumProductVendorFieldUpdateOperationsInput | $Enums.ProductVendor
    type?: EnumProductTypeFieldUpdateOperationsInput | $Enums.ProductType
    sextToSpeech?: TextToSpeechUncheckedUpdateManyWithoutProductNestedInput
    intelligence?: IntelligenceUncheckedUpdateManyWithoutProductNestedInput
  }

  export type ApplicationCreateWithoutIntelligenceInput = {
    ref?: string
    accessKeyId: string
    name: string
    type: $Enums.ApplicationType
    endpoint: string
    createdAt?: Date | string
    updatedAt?: Date | string
    textToSpeech?: TextToSpeechCreateNestedOneWithoutApplicationInput
    speechToText?: SpeechToTextCreateNestedOneWithoutApplicationInput
  }

  export type ApplicationUncheckedCreateWithoutIntelligenceInput = {
    ref?: string
    accessKeyId: string
    name: string
    type: $Enums.ApplicationType
    endpoint: string
    createdAt?: Date | string
    updatedAt?: Date | string
    textToSpeech?: TextToSpeechUncheckedCreateNestedOneWithoutApplicationInput
    speechToText?: SpeechToTextUncheckedCreateNestedOneWithoutApplicationInput
  }

  export type ApplicationCreateOrConnectWithoutIntelligenceInput = {
    where: ApplicationWhereUniqueInput
    create: XOR<ApplicationCreateWithoutIntelligenceInput, ApplicationUncheckedCreateWithoutIntelligenceInput>
  }

  export type ProductCreateWithoutIntelligenceInput = {
    ref: string
    name: string
    vendor: $Enums.ProductVendor
    type: $Enums.ProductType
    speechToText?: SpeechToTextCreateNestedManyWithoutProductInput
    sextToSpeech?: TextToSpeechCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateWithoutIntelligenceInput = {
    ref: string
    name: string
    vendor: $Enums.ProductVendor
    type: $Enums.ProductType
    speechToText?: SpeechToTextUncheckedCreateNestedManyWithoutProductInput
    sextToSpeech?: TextToSpeechUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductCreateOrConnectWithoutIntelligenceInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutIntelligenceInput, ProductUncheckedCreateWithoutIntelligenceInput>
  }

  export type ApplicationUpsertWithoutIntelligenceInput = {
    update: XOR<ApplicationUpdateWithoutIntelligenceInput, ApplicationUncheckedUpdateWithoutIntelligenceInput>
    create: XOR<ApplicationCreateWithoutIntelligenceInput, ApplicationUncheckedCreateWithoutIntelligenceInput>
    where?: ApplicationWhereInput
  }

  export type ApplicationUpdateToOneWithWhereWithoutIntelligenceInput = {
    where?: ApplicationWhereInput
    data: XOR<ApplicationUpdateWithoutIntelligenceInput, ApplicationUncheckedUpdateWithoutIntelligenceInput>
  }

  export type ApplicationUpdateWithoutIntelligenceInput = {
    ref?: StringFieldUpdateOperationsInput | string
    accessKeyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumApplicationTypeFieldUpdateOperationsInput | $Enums.ApplicationType
    endpoint?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    textToSpeech?: TextToSpeechUpdateOneWithoutApplicationNestedInput
    speechToText?: SpeechToTextUpdateOneWithoutApplicationNestedInput
  }

  export type ApplicationUncheckedUpdateWithoutIntelligenceInput = {
    ref?: StringFieldUpdateOperationsInput | string
    accessKeyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumApplicationTypeFieldUpdateOperationsInput | $Enums.ApplicationType
    endpoint?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    textToSpeech?: TextToSpeechUncheckedUpdateOneWithoutApplicationNestedInput
    speechToText?: SpeechToTextUncheckedUpdateOneWithoutApplicationNestedInput
  }

  export type ProductUpsertWithoutIntelligenceInput = {
    update: XOR<ProductUpdateWithoutIntelligenceInput, ProductUncheckedUpdateWithoutIntelligenceInput>
    create: XOR<ProductCreateWithoutIntelligenceInput, ProductUncheckedCreateWithoutIntelligenceInput>
    where?: ProductWhereInput
  }

  export type ProductUpdateToOneWithWhereWithoutIntelligenceInput = {
    where?: ProductWhereInput
    data: XOR<ProductUpdateWithoutIntelligenceInput, ProductUncheckedUpdateWithoutIntelligenceInput>
  }

  export type ProductUpdateWithoutIntelligenceInput = {
    ref?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    vendor?: EnumProductVendorFieldUpdateOperationsInput | $Enums.ProductVendor
    type?: EnumProductTypeFieldUpdateOperationsInput | $Enums.ProductType
    speechToText?: SpeechToTextUpdateManyWithoutProductNestedInput
    sextToSpeech?: TextToSpeechUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateWithoutIntelligenceInput = {
    ref?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    vendor?: EnumProductVendorFieldUpdateOperationsInput | $Enums.ProductVendor
    type?: EnumProductTypeFieldUpdateOperationsInput | $Enums.ProductType
    speechToText?: SpeechToTextUncheckedUpdateManyWithoutProductNestedInput
    sextToSpeech?: TextToSpeechUncheckedUpdateManyWithoutProductNestedInput
  }

  export type SpeechToTextCreateWithoutProductInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    application: ApplicationCreateNestedOneWithoutSpeechToTextInput
  }

  export type SpeechToTextUncheckedCreateWithoutProductInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    applicationRef: string
  }

  export type SpeechToTextCreateOrConnectWithoutProductInput = {
    where: SpeechToTextWhereUniqueInput
    create: XOR<SpeechToTextCreateWithoutProductInput, SpeechToTextUncheckedCreateWithoutProductInput>
  }

  export type SpeechToTextCreateManyProductInputEnvelope = {
    data: SpeechToTextCreateManyProductInput | SpeechToTextCreateManyProductInput[]
    skipDuplicates?: boolean
  }

  export type TextToSpeechCreateWithoutProductInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    application: ApplicationCreateNestedOneWithoutTextToSpeechInput
  }

  export type TextToSpeechUncheckedCreateWithoutProductInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    applicationRef: string
  }

  export type TextToSpeechCreateOrConnectWithoutProductInput = {
    where: TextToSpeechWhereUniqueInput
    create: XOR<TextToSpeechCreateWithoutProductInput, TextToSpeechUncheckedCreateWithoutProductInput>
  }

  export type TextToSpeechCreateManyProductInputEnvelope = {
    data: TextToSpeechCreateManyProductInput | TextToSpeechCreateManyProductInput[]
    skipDuplicates?: boolean
  }

  export type IntelligenceCreateWithoutProductInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    credentials: string
    application: ApplicationCreateNestedOneWithoutIntelligenceInput
  }

  export type IntelligenceUncheckedCreateWithoutProductInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    credentials: string
    applicationRef: string
  }

  export type IntelligenceCreateOrConnectWithoutProductInput = {
    where: IntelligenceWhereUniqueInput
    create: XOR<IntelligenceCreateWithoutProductInput, IntelligenceUncheckedCreateWithoutProductInput>
  }

  export type IntelligenceCreateManyProductInputEnvelope = {
    data: IntelligenceCreateManyProductInput | IntelligenceCreateManyProductInput[]
    skipDuplicates?: boolean
  }

  export type SpeechToTextUpsertWithWhereUniqueWithoutProductInput = {
    where: SpeechToTextWhereUniqueInput
    update: XOR<SpeechToTextUpdateWithoutProductInput, SpeechToTextUncheckedUpdateWithoutProductInput>
    create: XOR<SpeechToTextCreateWithoutProductInput, SpeechToTextUncheckedCreateWithoutProductInput>
  }

  export type SpeechToTextUpdateWithWhereUniqueWithoutProductInput = {
    where: SpeechToTextWhereUniqueInput
    data: XOR<SpeechToTextUpdateWithoutProductInput, SpeechToTextUncheckedUpdateWithoutProductInput>
  }

  export type SpeechToTextUpdateManyWithWhereWithoutProductInput = {
    where: SpeechToTextScalarWhereInput
    data: XOR<SpeechToTextUpdateManyMutationInput, SpeechToTextUncheckedUpdateManyWithoutProductInput>
  }

  export type SpeechToTextScalarWhereInput = {
    AND?: SpeechToTextScalarWhereInput | SpeechToTextScalarWhereInput[]
    OR?: SpeechToTextScalarWhereInput[]
    NOT?: SpeechToTextScalarWhereInput | SpeechToTextScalarWhereInput[]
    ref?: StringFilter<"SpeechToText"> | string
    config?: JsonFilter<"SpeechToText">
    applicationRef?: StringFilter<"SpeechToText"> | string
    productRef?: StringFilter<"SpeechToText"> | string
  }

  export type TextToSpeechUpsertWithWhereUniqueWithoutProductInput = {
    where: TextToSpeechWhereUniqueInput
    update: XOR<TextToSpeechUpdateWithoutProductInput, TextToSpeechUncheckedUpdateWithoutProductInput>
    create: XOR<TextToSpeechCreateWithoutProductInput, TextToSpeechUncheckedCreateWithoutProductInput>
  }

  export type TextToSpeechUpdateWithWhereUniqueWithoutProductInput = {
    where: TextToSpeechWhereUniqueInput
    data: XOR<TextToSpeechUpdateWithoutProductInput, TextToSpeechUncheckedUpdateWithoutProductInput>
  }

  export type TextToSpeechUpdateManyWithWhereWithoutProductInput = {
    where: TextToSpeechScalarWhereInput
    data: XOR<TextToSpeechUpdateManyMutationInput, TextToSpeechUncheckedUpdateManyWithoutProductInput>
  }

  export type TextToSpeechScalarWhereInput = {
    AND?: TextToSpeechScalarWhereInput | TextToSpeechScalarWhereInput[]
    OR?: TextToSpeechScalarWhereInput[]
    NOT?: TextToSpeechScalarWhereInput | TextToSpeechScalarWhereInput[]
    ref?: StringFilter<"TextToSpeech"> | string
    config?: JsonFilter<"TextToSpeech">
    applicationRef?: StringFilter<"TextToSpeech"> | string
    productRef?: StringFilter<"TextToSpeech"> | string
  }

  export type IntelligenceUpsertWithWhereUniqueWithoutProductInput = {
    where: IntelligenceWhereUniqueInput
    update: XOR<IntelligenceUpdateWithoutProductInput, IntelligenceUncheckedUpdateWithoutProductInput>
    create: XOR<IntelligenceCreateWithoutProductInput, IntelligenceUncheckedCreateWithoutProductInput>
  }

  export type IntelligenceUpdateWithWhereUniqueWithoutProductInput = {
    where: IntelligenceWhereUniqueInput
    data: XOR<IntelligenceUpdateWithoutProductInput, IntelligenceUncheckedUpdateWithoutProductInput>
  }

  export type IntelligenceUpdateManyWithWhereWithoutProductInput = {
    where: IntelligenceScalarWhereInput
    data: XOR<IntelligenceUpdateManyMutationInput, IntelligenceUncheckedUpdateManyWithoutProductInput>
  }

  export type IntelligenceScalarWhereInput = {
    AND?: IntelligenceScalarWhereInput | IntelligenceScalarWhereInput[]
    OR?: IntelligenceScalarWhereInput[]
    NOT?: IntelligenceScalarWhereInput | IntelligenceScalarWhereInput[]
    ref?: StringFilter<"Intelligence"> | string
    config?: JsonFilter<"Intelligence">
    credentials?: StringFilter<"Intelligence"> | string
    applicationRef?: StringFilter<"Intelligence"> | string
    productRef?: StringFilter<"Intelligence"> | string
  }

  export type SpeechToTextCreateManyProductInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    applicationRef: string
  }

  export type TextToSpeechCreateManyProductInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    applicationRef: string
  }

  export type IntelligenceCreateManyProductInput = {
    ref?: string
    config: JsonNullValueInput | InputJsonValue
    credentials: string
    applicationRef: string
  }

  export type SpeechToTextUpdateWithoutProductInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    application?: ApplicationUpdateOneRequiredWithoutSpeechToTextNestedInput
  }

  export type SpeechToTextUncheckedUpdateWithoutProductInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    applicationRef?: StringFieldUpdateOperationsInput | string
  }

  export type SpeechToTextUncheckedUpdateManyWithoutProductInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    applicationRef?: StringFieldUpdateOperationsInput | string
  }

  export type TextToSpeechUpdateWithoutProductInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    application?: ApplicationUpdateOneRequiredWithoutTextToSpeechNestedInput
  }

  export type TextToSpeechUncheckedUpdateWithoutProductInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    applicationRef?: StringFieldUpdateOperationsInput | string
  }

  export type TextToSpeechUncheckedUpdateManyWithoutProductInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    applicationRef?: StringFieldUpdateOperationsInput | string
  }

  export type IntelligenceUpdateWithoutProductInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    credentials?: StringFieldUpdateOperationsInput | string
    application?: ApplicationUpdateOneRequiredWithoutIntelligenceNestedInput
  }

  export type IntelligenceUncheckedUpdateWithoutProductInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    credentials?: StringFieldUpdateOperationsInput | string
    applicationRef?: StringFieldUpdateOperationsInput | string
  }

  export type IntelligenceUncheckedUpdateManyWithoutProductInput = {
    ref?: StringFieldUpdateOperationsInput | string
    config?: JsonNullValueInput | InputJsonValue
    credentials?: StringFieldUpdateOperationsInput | string
    applicationRef?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}