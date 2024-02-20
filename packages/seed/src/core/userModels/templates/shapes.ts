import * as levensthein from "fastest-levenshtein";
import { mapValues } from "remeda";
import { type JsTypeName } from "../types.js";

export const SHAPE_CANDIDATES = {
  UUID: ["id", "uuid", "uuidv4", "identifier"],
  INDEX: ["id", "index", "key"],
  NUMBER: [
    "account number",
    "invoice number",
    "order number",
    "number",
    "version",
    "amount",
  ],
  FULL_NAME: ["name", "title"],
  FIRST_NAME: ["first name"],
  LAST_NAME: ["last name"],
  DESCRIPTION: ["description", "text", "body", "content"],
  DATE: [
    "date",
    "expire",
    "created at",
    "updated at",
    "expiry",
    "expiry date",
    "time",
  ],
  DATE_OF_BIRTH: ["date of birth", "dob", "birthday"],
  GENDER: ["gender"],
  STREET_ADDRESS: ["street"],
  FULL_ADDRESS: ["address"],
  CITY: ["city", "town"],
  COUNTRY: ["country", "county"],
  STATE: ["province", "state"],
  ZIP_CODE: ["postal code", "zip code"],
  COUNTRY_CODE: ["country code"],
  LATITUDE: ["latitude"],
  LONGITUDE: ["longitude"],
  LOCATION: ["location", "coordinates"],
  TIMEZONE: ["timezone", "tz"],
  PHONE: ["imei", "imsi", "mobile number", "msisdn", "phone", "phone number"],
  EMAIL: ["email"],
  PASSWORD: ["password"],
  USERNAME: ["login", "username"],
  TOKEN: ["token", "sub"],
  USER_AGENT: ["user agent"],
  IP_ADDRESS: ["ip", "ip address"],
  MAC_ADDRESS: ["mac", "mac address"],
  STATUS: ["status"],
  LOGS: ["logs"],
  EMPLOYER_IDENTIFICATION_NUMBER: ["ein", "employer identification number"],
  AGE: ["age"],
  BANK_ACCOUNT_NUMBER_FULL: ["bank account number", "iban"],
  BANK_ACCOUNT_NUMBER_LAST4: ["bank account last 4"],
  BANK_ROUTING_FULL: ["bank routing number"],
  BANK_ROUTING_LAST4: ["bank routing last 4"],
  CHECKSUM: ["checksum"],
  CREDIT_DEBIT_NUMBER: ["credit card number", "debit card number"],
  CREDIT_DEBIT_EXPIRY: ["credit card expiry", "debit card expiry"],
  CREDIT_DEBIT_CVV: ["credit card cvv", "debit card cvv"],
  CURRENCY: ["currency"],
  DRIVER_ID: ["driver id", "driver license id"],
  HASH: ["hash"],
  LICENSE_PLATE: ["vehicle license plate"],
  META_DATA: ["meta data", "metadata"],
  NATIONAL_IDENTIFICATION_NUMBER: ["national identification number", "nin"],
  OTHER_NAME: ["device name", "alias"],
  PIN: ["pin"],
  SEARCH_VECTOR: ["search vector", "search"],
  SSN_FULL: ["social security number", "ssn"],
  SSN_LAST4: ["social security last 4", "ssn last 4"],
  SWIFT_CODE: ["swift code", "swift", "bic"],
  TAX_AMOUNT: ["tax amount"],
  TAX_CODE: ["tax code"],
  TAX_IDENTIFICATION_NUMBER: ["tax identification number", "tin"],
  URL: ["url", "uri", "link"],
  VEHICLE_IDENTIFICATION_NUMBER: ["vehicle identification number", "vin"],
};

const SHAPES_BY_JS_TYPE: Partial<Record<JsTypeName, Array<Shape>>> = {
  string: [
    "UUID",
    "INDEX",
    "NUMBER",
    "FULL_NAME",
    "FIRST_NAME",
    "LAST_NAME",
    "DESCRIPTION",
    "DATE",
    "DATE_OF_BIRTH",
    "GENDER",
    "STREET_ADDRESS",
    "FULL_ADDRESS",
    "CITY",
    "COUNTRY",
    "STATE",
    "ZIP_CODE",
    "COUNTRY_CODE",
    "LATITUDE",
    "LONGITUDE",
    "TIMEZONE",
    "PHONE",
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
    "CURRENCY",
    "DRIVER_ID",
    "HASH",
    "LICENSE_PLATE",
    "META_DATA",
    "NATIONAL_IDENTIFICATION_NUMBER",
    "OTHER_NAME",
    "PIN",
    "SEARCH_VECTOR",
    "SSN_FULL",
    "SSN_LAST4",
    "SWIFT_CODE",
    "LOCATION",
    "TAX_CODE",
  ],
  number: [
    "NUMBER",
    "INDEX",
    "LATITUDE",
    "LONGITUDE",
    "AGE",
    "TAX_AMOUNT",
    "CREDIT_DEBIT_CVV",
    "TAX_CODE",
  ],
};

const SHAPE_LOOKUP_BY_JS_TYPE: Partial<
  Record<JsTypeName, Record<string, Shape>>
> = mapValues(SHAPES_BY_JS_TYPE, (shapes) => {
  const lookup: Record<string, Shape> = {};

  for (const shape of shapes ?? []) {
    for (const candidate of SHAPE_CANDIDATES[shape]) {
      lookup[candidate] = shape;
    }
  }

  return lookup;
});

export type Shape = keyof typeof SHAPE_CANDIDATES;
export type ShapeContext =
  | "AUTHENTICATION"
  | "FINANCE"
  | "GENERAL"
  | "HEALTH"
  | "LEGAL"
  | "PERSON";
type ShapeDistance = 0 | 1 | 2;

interface ShapeResult {
  closest: string;
  distance: ShapeDistance;
  shape: Shape;
}

// context(justinvdm, 5 May 2022): Original comment from [here](https://github.com/snaplet/snaplet/blob/26467a1a061f1bc26de929a3bf5bce70008473fc/api/src/services/pii/index.ts#L5)
// > I think we can probably include these by taking into account the table
// > user.name, customer.name, users.name.
// > since name would apply to many different scenarios.

export const findShape = (
  columnName: string,
  jsType: JsTypeName,
): ShapeResult | null => {
  const lookup = SHAPE_LOOKUP_BY_JS_TYPE[jsType];

  if (!lookup) {
    return null;
  }

  const closest = levensthein.closest(columnName, Object.keys(lookup));
  const distance = levensthein.distance(columnName, closest);

  if (distance <= 4) {
    return {
      shape: lookup[closest],
      closest,
      distance: distance as 0 | 1 | 2,
    };
  }

  return null;
};
