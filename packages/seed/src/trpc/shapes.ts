type ShapeContext =
  | "AUTHENTICATION"
  | "FINANCE"
  | "GENERAL"
  | "HEALTH"
  | "LEGAL"
  | "PERSON";

const GenerateShapes = [
  "VEHICLE_VRM",
  "VEHICLE_NAME",
  "VEHICLE_TYPE",
  "VEHICLE_MODEL",
  "VEHICLE_MANUFACTURER",
  "VEHICLE_FUEL",
  "VEHICLE_COLOR",
  "VEHICLE_BICYCLE",
  "SYSTEM_SEMVER",
  "SYSTEM_NETWORK_INTERFACE",
  "SYSTEM_MIME_TYPE",
  "SYSTEM_FILE_TYPE",
  "SYSTEM_FILE_PATH",
  "SYSTEM_FILE_NAME",
  "SYSTEM_FILE_EXT",
  "SYSTEM_DIRECTORY_PATH",
  "SYSTEM_CRON",
  // 'STRING_NANOID',
  "SCIENCE_UNIT_NAME",
  "SCIENCE_UNIT_SYMBOL",
  "SCIENCE_CHEMICAL_ELEMENT_SYMBOL",
  "SCIENCE_CHEMICAL_ELEMENT_NAME",
  "SCIENCE_CHEMICAL_ELEMENT_ATOMIC_NUMBER",
  "PHONE_IMEI",
  "PHONE_NUMBER",
  "PERSON_SUFFIX",
  "PERSON_PREFIX",
  "PERSON_FIRST_NAME",
  "PERSON_MIDDLE_NAME",
  "PERSON_LAST_NAME",
  "PERSON_JOB_TYPE",
  "PERSON_JOB_TITLE",
  "PERSON_JOB_DESCRIPTOR",
  "PERSON_JOB_AREA",
  "PERSON_FULL_NAME",
  "PERSON_BIO",
  "MUSIC_SONG_NAME",
  "MUSIC_GENRE",
  "MUSIC_SINGER",
  "INTERNET_PROTOCOL",
  "INTERNET_PORT",
  "INTERNET_IPV6",
  "INTERNET_IPV4",
  "INTERNET_HTTP_STATUS_CODE",
  "INTERNET_HTTP_METHOD",
  "INTERNET_EMOJI",
  "INTERNET_DOMAIN_WORD",
  "INTERNET_DOMAIN_SUFFIX",
  "INTERNET_DOMAIN_NAME",
  "INTERNET_DISPLAY_NAME",
  "INTERNET_COLOR",
  "INTERNET_AVATAR",
  "IMAGE_URL",
  "IMAGE_RAW",
  "GIT_SHORT_SHA",
  "GIT_COMMIT_SHA",
  "GIT_COMMIT_MESSAGE",
  "GIT_COMMIT_ENTRY",
  "GIT_BRANCH",
  "FINANCE_TRANSACTION_TYPE",
  "FINANCE_TRANSACTION_DESCRIPTION",
  // 'FINANCE_ROUTING_NUMBER',
  "FINANCE_MASKED_NUMBER",
  "FINANCE_IBAN",
  "FINANCE_CURRENCY_SYMBOL",
  "FINANCE_CURRENCY_CODE",
  "FINANCE_CURRENCY_NAME",
  "FINANCE_CURRENCY_SYMBOL",
  "FINANCE_CREDIT_CARD_ISSUER",
  "FINANCE_CRYPTO_ADDRESS",
  "SWIFT_CODE",
  "FINANCE_ACCOUNT_NAME",
  "FINANCE_ACCOUNT",
  "DATABASE_PROVIDER",
  "DATABASE_MONGODB_OBJECT_ID",
  "DATABASE_ENGINE",
  "DATABASE_COLUMN",
  "DATABASE_COLLATION",
  "COMPANY_SUFFIXES",
  "COMPANY_NAME",
  "COMPANY_CATCH_PHRASE_NOUN",
  "COMPANY_CATCH_PHRASE_DESCRIPTOR",
  "COMPANY_CATCH_PHRASE_ADJECTIVE",
  "COMPANY_CATCH_PHRASE",
  "COMMERCE_PRODUCT_NAME",
  "COMMERCE_PRODUCT_MATERIAL",
  "COMMERCE_PRODUCT_DESCRIPTION",
  "COMMERCE_PRODUCT_ADJECTIVE",
  "COMMERCE_PRODUCT",
  "COMMERCE_ISBN",
  "COMMERCE_DEPARTMENT",
  "COLOR_HUMAN",
  "ANIMAL_TYPE",
  "ANIMAL_SNAKE",
  "ANIMAL_RODENT",
  "ANIMAL_RABBIT",
  "ANIMAL_LION",
  "ANIMAL_INSECT",
  "ANIMAL_HORSE",
  "ANIMAL_FISH",
  "ANIMAL_DOG",
  "ANIMAL_CROCODILIA",
  "ANIMAL_COW",
  "ANIMAL_CETACEAN",
  "ANIMAL_CAT",
  "ANIMAL_BIRD",
  "ANIMAL_BEAR",
  "AIRLINE_SEAT",
  "AIRLINE_RECORD_LOCATOR",
  "AIRLINE_FLIGHT_NUMBER",
  "AIRLINE_AIRPORT_NAME",
  "AIRLINE_AIRPORT_IATA_CODE",
  "AIRLINE_AIRPLANE_NAME",
  "AIRLINE_AIRPLANE_IATA_TYPE_CODE",
  "AIRLINE_AIRLINE_NAME",
  "AIRLINE_AIRLINE_IATA_CODE",
  "AIRLINE_AIRCRAFT_TYPE",
  "LOCATION_GPS_COORDINATE",
  "LOCATION_DIRECTION",
  "LOCATION_BUILDING_NUMBER",
  "LOCATION_LATITUDE",
  "LOCATION_LONGITUDE",
  "UUID",
  "INDEX",
  "DATE",
  "GENDER",
  "STREET_ADDRESS",
  "FULL_ADDRESS",
  "CITY",
  "COUNTRY",
  "STATE",
  "ZIP_CODE",
  "COUNTRY_CODE",
  "TIMEZONE",
  "EMAIL",
  "PASSWORD",
  "USERNAME",
  "TOKEN",
  "USER_AGENT",
  "IP_ADDRESS",
  "MAC_ADDRESS",
  "LOGS",
  "STATUS",
  "EMPLOYER_IDENTIFICATION_NUMBER",
  "AGE",
  "BANK_ACCOUNT_NUMBER_FULL",
  "BANK_ACCOUNT_NUMBER_LAST4",
  "BANK_ROUTING_FULL",
  "BANK_ROUTING_LAST4",
  "CHECKSUM",
  "CREDIT_DEBIT_NUMBER",
  "CREDIT_DEBIT_EXPIRY",
  "CREDIT_DEBIT_CVV",
  "DRIVER_ID",
  "HASH",
  "LICENSE_PLATE",
  "META_DATA",
  "NATIONAL_IDENTIFICATION_NUMBER",
  "PIN",
  "SEARCH_VECTOR",
  "SSN_FULL",
  "SSN_LAST4",
  "SWIFT_CODE",
  "TAX_CODE",
  "AWS_ARN",
  "AWS_REGION",
  "AWS_SERVICE",
  "DRINKS",
  "BOOK_TITLE",
  "BOOK_AUTHOR",
  "BOOK_CATEGORY",
  "POST_TITLE",
  "POST_COMMENT",
  "POST_BODY",
  "FOOD",
  "MOTORCYCLE",
  "MOVIE_TITLE",
  "MOVIE_CHARACTER",
  "MUSIC_SINGER",
  "SPORTS",
  "SPORTS_TEAM",
  "PERMISSION",
  "ROLE",
  "RATING",
  "AGE",
  "ENVIRONMENT_VARIABLE",
  "LATITUDE",
  "LONGITUDE",
] as const;

export type Shape = "__DEFAULT" | (typeof GenerateShapes)[number];

interface PredictedShape {
  column: string;
  confidence?: number;
  confidenceContext?: number;
  context?: ShapeContext;
  input: string;
  shape?: Shape;
}

export interface TableShapePredictions {
  predictions: Array<PredictedShape>;
  schemaName: string;
  tableName: string;
}

export interface StartPredictionsColumn {
  columnName: string;
  description?: string;
  examples?: Array<string>;
  pgType: string;
  sampleSize?: number;
  schemaName: string;
  tableName: string;
  useLLMByDefault: boolean;
}
