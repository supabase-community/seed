import { type Shape } from "~/shapes.js";
import { mapValues } from "remeda";
import { evaluateGenerateColumn } from "../testing.js";
import { strings } from "./strings.js";

describe("strings", () => {
  test("evaluation of generated code", () => {
    const results = mapValues(
      strings,
      (template, shape) =>
        template && evaluateGenerateColumn(template, "string", shape as Shape),
    );

    expect(results).toMatchInlineSnapshot(`
      {
        "AGE": {
          "kind": "success",
          "value": "15",
        },
        "AIRLINE_AIRCRAFT_TYPE": {
          "kind": "success",
          "value": "widebody",
        },
        "AIRLINE_AIRLINE_IATA_CODE": {
          "kind": "success",
          "value": "5J",
        },
        "AIRLINE_AIRLINE_NAME": {
          "kind": "success",
          "value": "Delta Air Lines",
        },
        "AIRLINE_AIRPLANE_IATA_TYPE_CODE": {
          "kind": "success",
          "value": "M87",
        },
        "AIRLINE_AIRPLANE_NAME": {
          "kind": "success",
          "value": "Airbus A340-200",
        },
        "AIRLINE_AIRPORT_IATA_CODE": {
          "kind": "success",
          "value": "DME",
        },
        "AIRLINE_AIRPORT_NAME": {
          "kind": "success",
          "value": "McCarran International Airport",
        },
        "AIRLINE_FLIGHT_NUMBER": {
          "kind": "success",
          "value": "324",
        },
        "AIRLINE_RECORD_LOCATOR": {
          "kind": "success",
          "value": "ZMXREU",
        },
        "AIRLINE_SEAT": {
          "kind": "success",
          "value": "10D",
        },
        "ANIMAL_BEAR": {
          "kind": "success",
          "value": "Asian black bear",
        },
        "ANIMAL_BIRD": {
          "kind": "success",
          "value": "Tennessee Warbler",
        },
        "ANIMAL_CAT": {
          "kind": "success",
          "value": "Donskoy",
        },
        "ANIMAL_CETACEAN": {
          "kind": "success",
          "value": "Indo-Pacific Bottlenose Dolphin",
        },
        "ANIMAL_COW": {
          "kind": "success",
          "value": "Amsterdam Island cattle",
        },
        "ANIMAL_CROCODILIA": {
          "kind": "success",
          "value": "Orinoco Crocodile",
        },
        "ANIMAL_DOG": {
          "kind": "success",
          "value": "Glen of Imaal Terrier",
        },
        "ANIMAL_FISH": {
          "kind": "success",
          "value": "Bigeye tuna",
        },
        "ANIMAL_HORSE": {
          "kind": "success",
          "value": "Nangchen Horse",
        },
        "ANIMAL_INSECT": {
          "kind": "success",
          "value": "Great black wasp",
        },
        "ANIMAL_LION": {
          "kind": "success",
          "value": "Masai Lion",
        },
        "ANIMAL_RABBIT": {
          "kind": "success",
          "value": "Holland Lop",
        },
        "ANIMAL_RODENT": {
          "kind": "success",
          "value": "Pearson's tuco-tuco",
        },
        "ANIMAL_SNAKE": {
          "kind": "success",
          "value": "Madagascar tree boa",
        },
        "ANIMAL_TYPE": {
          "kind": "success",
          "value": "horse",
        },
        "AWS_ARN": {
          "kind": "success",
          "value": "arn:aws-cn:s3:::/usr/ports/*",
        },
        "AWS_REGION": {
          "kind": "success",
          "value": "us-west-1",
        },
        "AWS_SERVICE": {
          "kind": "success",
          "value": "ElastiCache",
        },
        "BOOK_AUTHOR": {
          "kind": "success",
          "value": "Harriet Beecher Stowe",
        },
        "BOOK_CATEGORY": {
          "kind": "success",
          "value": "Crime",
        },
        "BOOK_TITLE": {
          "kind": "success",
          "value": "Nineteen Eighty-Four",
        },
        "CITY": {
          "kind": "success",
          "value": "Cicero",
        },
        "COLOR_CMYK": {
          "kind": "success",
          "value": "0.45,0.84,0.22,0.07",
        },
        "COLOR_COLOR_BY_C_S_S_COLOR_SPACE": {
          "kind": "success",
          "value": "0.3635,0.5225,0.8955",
        },
        "COLOR_CSS_SUPPORTED_FUNCTION": {
          "kind": "success",
          "value": "rgba",
        },
        "COLOR_CSS_SUPPORTED_SPACE": {
          "kind": "success",
          "value": "display-p3",
        },
        "COLOR_HSL": {
          "kind": "success",
          "value": "338,0.56,0.85",
        },
        "COLOR_HUMAN": {
          "kind": "success",
          "value": "olive",
        },
        "COLOR_HWB": {
          "kind": "success",
          "value": "355,0.81,0.4",
        },
        "COLOR_LAB": {
          "kind": "success",
          "value": "0.966787,61.8863,92.2686",
        },
        "COLOR_LCH": {
          "kind": "success",
          "value": "0.925071,90.5,13.8",
        },
        "COLOR_RGB": {
          "kind": "success",
          "value": "#9d279b",
        },
        "COLOR_SPACE": {
          "kind": "success",
          "value": "Pantone Matching System (PMS)",
        },
        "COMMERCE_DEPARTMENT": {
          "kind": "success",
          "value": "Toys",
        },
        "COMMERCE_ISBN": {
          "kind": "success",
          "value": "978-0-909509-67-5",
        },
        "COMMERCE_PRODUCT": {
          "kind": "success",
          "value": "Tuna",
        },
        "COMMERCE_PRODUCT_DESCRIPTION": {
          "kind": "success",
          "value": "conclusionem",
        },
        "COMMERCE_PRODUCT_MATERIAL": {
          "kind": "success",
          "value": "Granite",
        },
        "COMMERCE_PRODUCT_NAME": {
          "kind": "success",
          "value": "Handmade Frozen Pizza",
        },
        "COMPANY_BS": {
          "kind": "success",
          "value": "exploit integrated platforms",
        },
        "COMPANY_BS_ADJECTIVE": {
          "kind": "success",
          "value": "bleeding-edge",
        },
        "COMPANY_BS_BUZZ": {
          "kind": "success",
          "value": "revolutionize",
        },
        "COMPANY_BS_NOUN": {
          "kind": "success",
          "value": "solutions",
        },
        "COMPANY_BUZZ_ADJECTIVE": {
          "kind": "success",
          "value": "user-centric",
        },
        "COMPANY_BUZZ_NOUN": {
          "kind": "success",
          "value": "functionalities",
        },
        "COMPANY_BUZZ_PHRASE": {
          "kind": "success",
          "value": "drive revolutionary e-markets",
        },
        "COMPANY_BUZZ_VERB": {
          "kind": "success",
          "value": "embrace",
        },
        "COMPANY_CATCH_PHRASE": {
          "kind": "success",
          "value": "Stand-alone exuding collaboration",
        },
        "COMPANY_CATCH_PHRASE_ADJECTIVE": {
          "kind": "success",
          "value": "Streamlined",
        },
        "COMPANY_CATCH_PHRASE_DESCRIPTOR": {
          "kind": "success",
          "value": "value-added",
        },
        "COMPANY_CATCH_PHRASE_NOUN": {
          "kind": "success",
          "value": "website",
        },
        "COMPANY_NAME": {
          "kind": "success",
          "value": "Rohan and Sons",
        },
        "COMPANY_SUFFIXES": {
          "kind": "success",
          "value": "LLC",
        },
        "COUNTRY": {
          "kind": "success",
          "value": "Hong Kong",
        },
        "COUNTRY_CODE": {
          "kind": "success",
          "value": "SL",
        },
        "DATABASE_COLLATION": {
          "kind": "success",
          "value": "ascii_bin",
        },
        "DATABASE_COLUMN": {
          "kind": "success",
          "value": "avatar",
        },
        "DATABASE_ENGINE": {
          "kind": "success",
          "value": "MyISAM",
        },
        "DATABASE_MONGODB_OBJECT_ID": {
          "kind": "success",
          "value": "ef79dfbbd3e10df05d7efaf7",
        },
        "DATABASE_PROVIDER": {
          "kind": "success",
          "value": "postgres",
        },
        "DATE": {
          "kind": "success",
          "value": "2020-03-15T14:27:04.000Z",
        },
        "DATE_OF_BIRTH": {
          "kind": "success",
          "value": "1994-03-15T14:27:04.000Z",
        },
        "DRINKS": {
          "kind": "success",
          "value": "Natural Vanilla Syrup",
        },
        "EMAIL": {
          "kind": "success",
          "value": "Oran_Kohler74811@thesejackfruit.info",
        },
        "ENVIRONMENT_VARIABLE": {
          "kind": "success",
          "value": "Graecis",
        },
        "FINANCE_ACCOUNT": {
          "kind": "success",
          "value": "08234625",
        },
        "FINANCE_ACCOUNT_NAME": {
          "kind": "success",
          "value": "Money Market Account",
        },
        "FINANCE_CREDIT_CARD_ISSUER": {
          "kind": "success",
          "value": "visa",
        },
        "FINANCE_CRYPTO_ADDRESS": {
          "kind": "success",
          "value": "38i1E7Ki9AJSB4BFJZ8Gx62xp92y6cA",
        },
        "FINANCE_CURRENCY_CODE": {
          "kind": "success",
          "value": "XAF",
        },
        "FINANCE_CURRENCY_NAME": {
          "kind": "success",
          "value": "Rial Omani",
        },
        "FINANCE_CURRENCY_SYMBOL": {
          "kind": "success",
          "value": "₪",
        },
        "FINANCE_IBAN": {
          "kind": "success",
          "value": "GB28BFQM94008527700002",
        },
        "FINANCE_MASKED_NUMBER": {
          "kind": "success",
          "value": "(...0839)",
        },
        "FINANCE_TRANSACTION_DESCRIPTION": {
          "kind": "success",
          "value": "conclusionem",
        },
        "FINANCE_TRANSACTION_TYPE": {
          "kind": "success",
          "value": "payment",
        },
        "FIRST_NAME": {
          "kind": "success",
          "value": "Mireille",
        },
        "FOOD": {
          "kind": "success",
          "value": "Bandeja paisa",
        },
        "FULL_ADDRESS": {
          "kind": "success",
          "value": "551 Agustin Street, Everett 2985, Slovakia (Slovak",
        },
        "FULL_NAME": {
          "kind": "success",
          "value": "Myrtis Hartmann",
        },
        "GENDER": {
          "kind": "success",
          "value": "Not specified",
        },
        "GIT_BRANCH": {
          "kind": "success",
          "value": "bandwidth-index",
        },
        "GIT_COMMIT_ENTRY": {
          "kind": "success",
          "value": "conclusionem",
        },
        "GIT_COMMIT_MESSAGE": {
          "kind": "success",
          "value": "override wireless panel",
        },
        "GIT_COMMIT_SHA": {
          "kind": "success",
          "value": "672bc39b60c1eade6d51e2534f9bee9023bbd7ef",
        },
        "GIT_SHORT_SHA": {
          "kind": "success",
          "value": "52adea6",
        },
        "HACKER_ABBREVIATION": {
          "kind": "success",
          "value": "AGP",
        },
        "HACKER_ADJECTIVE": {
          "kind": "success",
          "value": "back-end",
        },
        "HACKER_INGVERB": {
          "kind": "success",
          "value": "quantifying",
        },
        "HACKER_NOUN": {
          "kind": "success",
          "value": "program",
        },
        "HACKER_PHRASE": {
          "kind": "success",
          "value": "We need to override the bluetooth DNS card!",
        },
        "HACKER_VERB": {
          "kind": "success",
          "value": "calculate",
        },
        "IMAGE": {
          "kind": "success",
          "value": "https://loremflickr.com/640/480/fashion",
        },
        "IMAGE_ABSTRACT": {
          "kind": "success",
          "value": "conclusionem",
        },
        "IMAGE_ANIMALS": {
          "kind": "success",
          "value": "conclusionem",
        },
        "IMAGE_AVATAR": {
          "kind": "success",
          "value": "https://avatars.githubusercontent.com/u/81330101",
        },
        "IMAGE_AVATAR_GIT_HUB": {
          "kind": "success",
          "value": "https://avatars.githubusercontent.com/u/77466678",
        },
        "IMAGE_AVATAR_LEGACY": {
          "kind": "success",
          "value": "conclusionem",
        },
        "IMAGE_BUSINESS": {
          "kind": "success",
          "value": "conclusionem",
        },
        "IMAGE_CATS": {
          "kind": "success",
          "value": "conclusionem",
        },
        "IMAGE_CITY": {
          "kind": "success",
          "value": "conclusionem",
        },
        "IMAGE_DATA_URI": {
          "kind": "success",
          "value": "conclusionem",
        },
        "IMAGE_FASHION": {
          "kind": "success",
          "value": "conclusionem",
        },
        "IMAGE_FOOD": {
          "kind": "success",
          "value": "conclusionem",
        },
        "IMAGE_IMAGE_URL": {
          "kind": "success",
          "value": "conclusionem",
        },
        "IMAGE_NATURE": {
          "kind": "success",
          "value": "conclusionem",
        },
        "IMAGE_NIGHTLIFE": {
          "kind": "success",
          "value": "conclusionem",
        },
        "IMAGE_PEOPLE": {
          "kind": "success",
          "value": "conclusionem",
        },
        "IMAGE_SPORTS": {
          "kind": "success",
          "value": "conclusionem",
        },
        "IMAGE_TECHNICS": {
          "kind": "success",
          "value": "conclusionem",
        },
        "IMAGE_TRANSPORT": {
          "kind": "success",
          "value": "conclusionem",
        },
        "INDEX": {
          "kind": "success",
          "value": "2afcff4e-718d-5a9b-a808-587c85fd225c",
        },
        "INTERNET_AVATAR": {
          "kind": "success",
          "value": "conclusionem",
        },
        "INTERNET_COLOR": {
          "kind": "success",
          "value": "#2b3009",
        },
        "INTERNET_DISPLAY_NAME": {
          "kind": "success",
          "value": "Dovie.Auer33",
        },
        "INTERNET_DOMAIN_NAME": {
          "kind": "success",
          "value": "cool-amendment.com",
        },
        "INTERNET_DOMAIN_SUFFIX": {
          "kind": "success",
          "value": "biz",
        },
        "INTERNET_DOMAIN_WORD": {
          "kind": "success",
          "value": "unselfish-epee",
        },
        "INTERNET_EMOJI": {
          "kind": "success",
          "value": "🍷",
        },
        "INTERNET_HTTP_METHOD": {
          "kind": "success",
          "value": "PATCH",
        },
        "INTERNET_HTTP_STATUS_CODE": {
          "kind": "success",
          "value": "305",
        },
        "INTERNET_IPV4": {
          "kind": "success",
          "value": "63.53.118.213",
        },
        "INTERNET_IPV6": {
          "kind": "success",
          "value": "7c89:56c7:ded8:7ed2:05a1:e5f4:f51a:b098",
        },
        "INTERNET_PORT": {
          "kind": "success",
          "value": "63770",
        },
        "INTERNET_PROTOCOL": {
          "kind": "success",
          "value": "http",
        },
        "IP_ADDRESS": {
          "kind": "success",
          "value": "176.62.96.92",
        },
        "LAST_NAME": {
          "kind": "success",
          "value": "Daugherty",
        },
        "LATITUDE": {
          "kind": "success",
          "value": "-71.3835837148697",
        },
        "LICENSE_PLATE": {
          "kind": "success",
          "value": "XI83UFB",
        },
        "LOCATION_BUILDING_NUMBER": {
          "kind": "success",
          "value": "1866",
        },
        "LOCATION_DIRECTION": {
          "kind": "success",
          "value": "Northeast",
        },
        "LOCATION_NEARBY_G_P_S_COORDINATE": {
          "kind": "success",
          "value": "48.6492,-126.389",
        },
        "LONGITUDE": {
          "kind": "success",
          "value": "-71.3835837148697",
        },
        "MAC_ADDRESS": {
          "kind": "success",
          "value": "0f:ca:b9:63:d6:b7",
        },
        "MOTORCYCLE": {
          "kind": "success",
          "value": "Honda",
        },
        "MOVIE_CHARACTER": {
          "kind": "success",
          "value": "Katniss Everdeen",
        },
        "MOVIE_TITLE": {
          "kind": "success",
          "value": "Million Dollar Baby",
        },
        "MUSIC_GENRE": {
          "kind": "success",
          "value": "Non Music",
        },
        "MUSIC_SINGER": {
          "kind": "success",
          "value": "Little Richard",
        },
        "MUSIC_SONG_NAME": {
          "kind": "success",
          "value": "Johnny B Goode",
        },
        "NUMBER": {
          "kind": "success",
          "value": "931565393829854",
        },
        "PASSWORD": {
          "kind": "success",
          "value": "mS@yAdCM9&yvzt",
        },
        "PERMISSION": {
          "kind": "success",
          "value": "write",
        },
        "PERSON_BIO": {
          "kind": "success",
          "value": "platelet advocate, leader",
        },
        "PERSON_FIRST_NAME": {
          "kind": "success",
          "value": "Mireille",
        },
        "PERSON_FULL_NAME": {
          "kind": "success",
          "value": "Johnny Kreiger",
        },
        "PERSON_JOB_AREA": {
          "kind": "success",
          "value": "Accounts",
        },
        "PERSON_JOB_DESCRIPTOR": {
          "kind": "success",
          "value": "Future",
        },
        "PERSON_JOB_TITLE": {
          "kind": "success",
          "value": "Global Assurance Executive",
        },
        "PERSON_JOB_TYPE": {
          "kind": "success",
          "value": "Manager",
        },
        "PERSON_LAST_NAME": {
          "kind": "success",
          "value": "Daugherty",
        },
        "PERSON_MIDDLE_NAME": {
          "kind": "success",
          "value": "Emerson",
        },
        "PERSON_PREFIX": {
          "kind": "success",
          "value": "Mrs.",
        },
        "PERSON_SUFFIX": {
          "kind": "success",
          "value": "MD",
        },
        "PERSON_ZODIAC_SIGN": {
          "kind": "success",
          "value": "Capricorn",
        },
        "PHONE": {
          "kind": "success",
          "value": "+931565393829854",
        },
        "PHONE_IMEI": {
          "kind": "success",
          "value": "90-271950-018590-9",
        },
        "PHONE_NUMBER": {
          "kind": "success",
          "value": "+931565393829854",
        },
        "POST_BODY": {
          "kind": "success",
          "value": "Ferre legamur eae nostrum es. Nec potes ant corpus",
        },
        "POST_COMMENT": {
          "kind": "success",
          "value": "Temperciplin es expetiuntur ipsis ad ent numererit",
        },
        "POST_TITLE": {
          "kind": "success",
          "value": "Temperciplin es expetiuntur ipsis ad ent numererit",
        },
        "RATING": {
          "kind": "success",
          "value": "5",
        },
        "ROLE": {
          "kind": "success",
          "value": "Viewer",
        },
        "SCIENCE_CHEMICAL_ELEMENT_ATOMIC_NUMBER": {
          "kind": "success",
          "value": "47",
        },
        "SCIENCE_CHEMICAL_ELEMENT_NAME": {
          "kind": "success",
          "value": "Titanium",
        },
        "SCIENCE_CHEMICAL_ELEMENT_SYMBOL": {
          "kind": "success",
          "value": "Ti",
        },
        "SCIENCE_UNIT_NAME": {
          "kind": "success",
          "value": "radian",
        },
        "SCIENCE_UNIT_SYMBOL": {
          "kind": "success",
          "value": "mol",
        },
        "SPORTS": {
          "kind": "success",
          "value": "Freestyle Skiing",
        },
        "SPORTS_TEAM": {
          "kind": "success",
          "value": "Green Bay Packers",
        },
        "STATE": {
          "kind": "success",
          "value": "North Dakota",
        },
        "STREET_ADDRESS": {
          "kind": "success",
          "value": "805 Wuckert Trail",
        },
        "STRING_NANOID": {
          "kind": "success",
          "value": "KGm88_5XdYb9T6eH5afwa",
        },
        "SWIFT_CODE": {
          "kind": "success",
          "value": "JQKMSETA",
        },
        "SYSTEM_CRON": {
          "kind": "success",
          "value": "6 * 12 * 4",
        },
        "SYSTEM_DIRECTORY_PATH": {
          "kind": "success",
          "value": "/usr/local/bin",
        },
        "SYSTEM_FILE_EXT": {
          "kind": "success",
          "value": "pps",
        },
        "SYSTEM_FILE_NAME": {
          "kind": "success",
          "value": "gleefully.iso",
        },
        "SYSTEM_FILE_PATH": {
          "kind": "success",
          "value": "/private/tmp/daily.lrf",
        },
        "SYSTEM_FILE_TYPE": {
          "kind": "success",
          "value": "video",
        },
        "SYSTEM_MIME_TYPE": {
          "kind": "success",
          "value": "font/woff2",
        },
        "SYSTEM_NETWORK_INTERFACE": {
          "kind": "success",
          "value": "wlo7",
        },
        "SYSTEM_SEMVER": {
          "kind": "success",
          "value": "4.4.4",
        },
        "TIMEZONE": {
          "kind": "success",
          "value": "Europe/Sofia",
        },
        "TOKEN": {
          "kind": "success",
          "value": "2afcff4e-718d-5a9b-a808-587c85fd225c",
        },
        "URL": {
          "kind": "success",
          "value": "https://whiff-dungeon.org",
        },
        "USERNAME": {
          "kind": "success",
          "value": "paralyse.flicker74811",
        },
        "USER_AGENT": {
          "kind": "success",
          "value": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_8 rv:",
        },
        "UUID": {
          "kind": "success",
          "value": "2afcff4e-718d-5a9b-a808-587c85fd225c",
        },
        "VEHICLE_BICYCLE": {
          "kind": "success",
          "value": "Track/Fixed-Gear Bicycle",
        },
        "VEHICLE_COLOR": {
          "kind": "success",
          "value": "black",
        },
        "VEHICLE_FUEL": {
          "kind": "success",
          "value": "Diesel",
        },
        "VEHICLE_MANUFACTURER": {
          "kind": "success",
          "value": "Chevrolet",
        },
        "VEHICLE_MODEL": {
          "kind": "success",
          "value": "Camry",
        },
        "VEHICLE_NAME": {
          "kind": "success",
          "value": "Jaguar Corvette",
        },
        "VEHICLE_TYPE": {
          "kind": "success",
          "value": "Sedan",
        },
        "VEHICLE_VRM": {
          "kind": "success",
          "value": "XI83UFB",
        },
        "ZIP_CODE": {
          "kind": "success",
          "value": "dovoggMisvr",
        },
        "__DEFAULT": {
          "kind": "success",
          "value": "Temperciplin es expetiuntur ipsis ad ent numererit",
        },
      }
    `);
  });
});
