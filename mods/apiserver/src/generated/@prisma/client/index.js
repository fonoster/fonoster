
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime
} = require('./runtime/library.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.1.0
 * Query Engine version: 11f085a2012c0f4778414c8db2651556ee0ef959
 */
Prisma.prismaVersion = {
  client: "6.1.0",
  engine: "11f085a2012c0f4778414c8db2651556ee0ef959"
}

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}




  const path = require('path')

/**
 * Enums
 */
exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.ApplicationScalarFieldEnum = {
  ref: 'ref',
  accessKeyId: 'accessKeyId',
  name: 'name',
  type: 'type',
  endpoint: 'endpoint',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TextToSpeechScalarFieldEnum = {
  ref: 'ref',
  config: 'config',
  applicationRef: 'applicationRef',
  productRef: 'productRef'
};

exports.Prisma.SpeechToTextScalarFieldEnum = {
  ref: 'ref',
  config: 'config',
  applicationRef: 'applicationRef',
  productRef: 'productRef'
};

exports.Prisma.IntelligenceScalarFieldEnum = {
  ref: 'ref',
  config: 'config',
  credentials: 'credentials',
  applicationRef: 'applicationRef',
  productRef: 'productRef'
};

exports.Prisma.ProductScalarFieldEnum = {
  ref: 'ref',
  name: 'name',
  vendor: 'vendor',
  type: 'type'
};

exports.Prisma.SecretScalarFieldEnum = {
  ref: 'ref',
  accessKeyId: 'accessKeyId',
  name: 'name',
  secret: 'secret',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.ApplicationType = exports.$Enums.ApplicationType = {
  EXTERNAL: 'EXTERNAL'
};

exports.ProductType = exports.$Enums.ProductType = {
  TTS: 'TTS',
  STT: 'STT',
  ASSISTANT: 'ASSISTANT'
};

exports.ProductVendor = exports.$Enums.ProductVendor = {
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

exports.Prisma.ModelName = {
  Application: 'Application',
  TextToSpeech: 'TextToSpeech',
  SpeechToText: 'SpeechToText',
  Intelligence: 'Intelligence',
  Product: 'Product',
  Secret: 'Secret'
};
/**
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "/Users/psanders/Projects/fonoster/mods/apiserver/src/generated/@prisma/client",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "darwin-arm64",
        "native": true
      },
      {
        "fromEnvVar": null,
        "value": "linux-arm64-openssl-3.0.x"
      }
    ],
    "previewFeatures": [],
    "sourceFilePath": "/Users/psanders/Projects/fonoster/mods/apiserver/schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../../../../../.env"
  },
  "relativePath": "../../../..",
  "clientVersion": "6.1.0",
  "engineVersion": "11f085a2012c0f4778414c8db2651556ee0ef959",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "generator client {\n  provider      = \"prisma-client-js\"\n  output        = \"src/generated/@prisma/client\"\n  binaryTargets = [\"native\", \"linux-arm64-openssl-3.0.x\"]\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\nmodel Application {\n  ref         String          @id @default(uuid())\n  accessKeyId String          @map(\"access_key_id\")\n  name        String          @db.VarChar(255)\n  type        ApplicationType\n  endpoint    String          @db.VarChar(255)\n  createdAt   DateTime        @default(now()) @map(\"created_at\")\n  updatedAt   DateTime        @default(now()) @map(\"updated_at\")\n\n  // Relations\n  textToSpeech TextToSpeech?\n  speechToText SpeechToText?\n  intelligence Intelligence?\n\n  // Indexes and maps\n  @@index([accessKeyId], type: Hash)\n  @@map(\"applications\")\n}\n\nmodel TextToSpeech {\n  ref    String @id @default(uuid())\n  config Json\n\n  // Relations\n  application    Application @relation(fields: [applicationRef], references: [ref], onDelete: Cascade)\n  applicationRef String      @unique @map(\"application_ref\")\n  product        Product     @relation(fields: [productRef], references: [ref], onDelete: Cascade)\n  productRef     String      @map(\"product_ref\")\n\n  // Indexes and maps\n  @@index([applicationRef], type: Hash)\n  @@index([productRef], type: Hash)\n  @@map(\"tts_services\")\n}\n\nmodel SpeechToText {\n  ref    String @id @default(uuid())\n  config Json\n\n  // Relations\n  application    Application @relation(fields: [applicationRef], references: [ref], onDelete: Cascade)\n  applicationRef String      @unique @map(\"application_ref\")\n  product        Product     @relation(fields: [productRef], references: [ref], onDelete: Cascade)\n  productRef     String      @map(\"product_ref\")\n\n  // Indexes and maps\n  @@index([applicationRef], type: Hash)\n  @@index([productRef], type: Hash)\n  @@map(\"stt_services\")\n}\n\nmodel Intelligence {\n  ref         String @id @default(uuid())\n  config      Json\n  credentials String @map(\"credentials_hash\") /// @encrypted\n\n  // Relations\n  application    Application @relation(fields: [applicationRef], references: [ref], onDelete: Cascade)\n  applicationRef String      @unique @map(\"application_ref\")\n  Product        Product     @relation(fields: [productRef], references: [ref], onDelete: Cascade)\n  productRef     String      @map(\"product_ref\")\n\n  // Indexes and maps\n  @@index([applicationRef], type: Hash)\n  @@index([productRef], type: Hash)\n  @@map(\"intelligence_services\")\n}\n\nmodel Product {\n  ref    String        @id\n  name   String\n  vendor ProductVendor\n  type   ProductType\n\n  // Relations\n  speechToText SpeechToText[]\n  sextToSpeech TextToSpeech[]\n  intelligence Intelligence[]\n\n  // Indexes and maps\n  @@map(\"products\")\n}\n\nmodel Secret {\n  ref         String   @id @default(uuid())\n  accessKeyId String   @map(\"access_key_id\")\n  name        String\n  secret      String   @map(\"secret_hash\") /// @encrypted\n  createdAt   DateTime @default(now()) @map(\"created_at\")\n  updatedAt   DateTime @default(now()) @map(\"updated_at\")\n\n  // Indexes and maps\n  @@index([accessKeyId], type: Hash)\n  @@index([name], type: Hash)\n  @@map(\"secrets\")\n}\n\nenum ApplicationType {\n  EXTERNAL\n\n  // Maps\n  @@map(\"application_types\")\n}\n\nenum ProductType {\n  TTS\n  STT\n  ASSISTANT\n\n  // Maps\n  @@map(\"product_types\")\n}\n\nenum ProductVendor {\n  GOOGLE\n  MICROSOFT\n  AMAZON\n  DEEPGRAM\n  IBM\n  RASA\n  OPENAI\n  GROQ\n  ELEVEN_LABS\n  GENERIC\n\n  // Maps\n  @@map(\"product_vendors\")\n}\n",
  "inlineSchemaHash": "690b9f502d1044e61212a3e0383a3c072349b9d21ae2a8d5ba3ebfc0aa3f48ae",
  "copyEngine": true
}

const fs = require('fs')

config.dirname = __dirname
if (!fs.existsSync(path.join(__dirname, 'schema.prisma'))) {
  const alternativePaths = [
    "mods/apiserver/src/generated/@prisma/client",
    "apiserver/src/generated/@prisma/client",
  ]
  
  const alternativePath = alternativePaths.find((altPath) => {
    return fs.existsSync(path.join(process.cwd(), altPath, 'schema.prisma'))
  }) ?? alternativePaths[0]

  config.dirname = path.join(process.cwd(), alternativePath)
  config.isBundled = true
}

config.runtimeDataModel = JSON.parse("{\"models\":{\"Application\":{\"dbName\":\"applications\",\"schema\":null,\"fields\":[{\"name\":\"ref\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"accessKeyId\",\"dbName\":\"access_key_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ApplicationType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"endpoint\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"dbName\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"textToSpeech\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"TextToSpeech\",\"nativeType\":null,\"relationName\":\"ApplicationToTextToSpeech\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"speechToText\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"SpeechToText\",\"nativeType\":null,\"relationName\":\"ApplicationToSpeechToText\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"intelligence\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Intelligence\",\"nativeType\":null,\"relationName\":\"ApplicationToIntelligence\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"TextToSpeech\":{\"dbName\":\"tts_services\",\"schema\":null,\"fields\":[{\"name\":\"ref\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"config\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"application\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Application\",\"nativeType\":null,\"relationName\":\"ApplicationToTextToSpeech\",\"relationFromFields\":[\"applicationRef\"],\"relationToFields\":[\"ref\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"applicationRef\",\"dbName\":\"application_ref\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"product\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Product\",\"nativeType\":null,\"relationName\":\"ProductToTextToSpeech\",\"relationFromFields\":[\"productRef\"],\"relationToFields\":[\"ref\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"productRef\",\"dbName\":\"product_ref\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"SpeechToText\":{\"dbName\":\"stt_services\",\"schema\":null,\"fields\":[{\"name\":\"ref\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"config\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"application\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Application\",\"nativeType\":null,\"relationName\":\"ApplicationToSpeechToText\",\"relationFromFields\":[\"applicationRef\"],\"relationToFields\":[\"ref\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"applicationRef\",\"dbName\":\"application_ref\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"product\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Product\",\"nativeType\":null,\"relationName\":\"ProductToSpeechToText\",\"relationFromFields\":[\"productRef\"],\"relationToFields\":[\"ref\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"productRef\",\"dbName\":\"product_ref\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Intelligence\":{\"dbName\":\"intelligence_services\",\"schema\":null,\"fields\":[{\"name\":\"ref\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"config\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"credentials\",\"dbName\":\"credentials_hash\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false,\"documentation\":\"@encrypted\"},{\"name\":\"application\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Application\",\"nativeType\":null,\"relationName\":\"ApplicationToIntelligence\",\"relationFromFields\":[\"applicationRef\"],\"relationToFields\":[\"ref\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"applicationRef\",\"dbName\":\"application_ref\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Product\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Product\",\"nativeType\":null,\"relationName\":\"IntelligenceToProduct\",\"relationFromFields\":[\"productRef\"],\"relationToFields\":[\"ref\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"productRef\",\"dbName\":\"product_ref\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Product\":{\"dbName\":\"products\",\"schema\":null,\"fields\":[{\"name\":\"ref\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"vendor\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ProductVendor\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ProductType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"speechToText\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"SpeechToText\",\"nativeType\":null,\"relationName\":\"ProductToSpeechToText\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sextToSpeech\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"TextToSpeech\",\"nativeType\":null,\"relationName\":\"ProductToTextToSpeech\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"intelligence\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Intelligence\",\"nativeType\":null,\"relationName\":\"IntelligenceToProduct\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Secret\":{\"dbName\":\"secrets\",\"schema\":null,\"fields\":[{\"name\":\"ref\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"accessKeyId\",\"dbName\":\"access_key_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"secret\",\"dbName\":\"secret_hash\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false,\"documentation\":\"@encrypted\"},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"dbName\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false}},\"enums\":{\"ApplicationType\":{\"values\":[{\"name\":\"EXTERNAL\",\"dbName\":null}],\"dbName\":\"application_types\"},\"ProductType\":{\"values\":[{\"name\":\"TTS\",\"dbName\":null},{\"name\":\"STT\",\"dbName\":null},{\"name\":\"ASSISTANT\",\"dbName\":null}],\"dbName\":\"product_types\"},\"ProductVendor\":{\"values\":[{\"name\":\"GOOGLE\",\"dbName\":null},{\"name\":\"MICROSOFT\",\"dbName\":null},{\"name\":\"AMAZON\",\"dbName\":null},{\"name\":\"DEEPGRAM\",\"dbName\":null},{\"name\":\"IBM\",\"dbName\":null},{\"name\":\"RASA\",\"dbName\":null},{\"name\":\"OPENAI\",\"dbName\":null},{\"name\":\"GROQ\",\"dbName\":null},{\"name\":\"ELEVEN_LABS\",\"dbName\":null},{\"name\":\"GENERIC\",\"dbName\":null}],\"dbName\":\"product_vendors\"}},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = undefined


const { warnEnvConflicts } = require('./runtime/library.js')

warnEnvConflicts({
    rootEnvPath: config.relativeEnvPaths.rootEnvPath && path.resolve(config.dirname, config.relativeEnvPaths.rootEnvPath),
    schemaEnvPath: config.relativeEnvPaths.schemaEnvPath && path.resolve(config.dirname, config.relativeEnvPaths.schemaEnvPath)
})

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

// file annotations for bundling tools to include these files
path.join(__dirname, "libquery_engine-darwin-arm64.dylib.node");
path.join(process.cwd(), "mods/apiserver/src/generated/@prisma/client/libquery_engine-darwin-arm64.dylib.node")

// file annotations for bundling tools to include these files
path.join(__dirname, "libquery_engine-linux-arm64-openssl-3.0.x.so.node");
path.join(process.cwd(), "mods/apiserver/src/generated/@prisma/client/libquery_engine-linux-arm64-openssl-3.0.x.so.node")
// file annotations for bundling tools to include these files
path.join(__dirname, "schema.prisma");
path.join(process.cwd(), "mods/apiserver/src/generated/@prisma/client/schema.prisma")
