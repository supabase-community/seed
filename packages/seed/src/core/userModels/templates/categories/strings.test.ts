import { describe, expect, test } from "vitest";
import { createTemplateContext, runTemplateCode } from "../testing.js";
import { type TemplateFn } from "../types.js";
import { strings } from "./strings.js";

describe("strings", () => {
  test("evaluation of generated code", () => {
    const results = Object.fromEntries(
      Object.entries(strings).map(([shape, templateFn]) => {
        const context = createTemplateContext();
        const code = (templateFn as TemplateFn)(context);
        const result = code ? runTemplateCode(context, code) : null;
        return [shape, result];
      }),
    );

    expect(results).toMatchInlineSnapshot(`
      {
        "AGE": {
          "success": true,
          "value": "53",
        },
        "AIRLINE_AIRCRAFT_TYPE": {
          "success": true,
          "value": "regional",
        },
        "AIRLINE_AIRLINE_IATA_CODE": {
          "success": true,
          "value": "DY",
        },
        "AIRLINE_AIRLINE_NAME": {
          "success": true,
          "value": "Gol Linhas Aereas Inteligentes",
        },
        "AIRLINE_AIRPLANE_IATA_TYPE_CODE": {
          "success": true,
          "value": "CR9",
        },
        "AIRLINE_AIRPLANE_NAME": {
          "success": true,
          "value": "Airbus A310-300",
        },
        "AIRLINE_AIRPORT_IATA_CODE": {
          "success": true,
          "value": "DFW",
        },
        "AIRLINE_AIRPORT_NAME": {
          "success": true,
          "value": "McCarran International Airport",
        },
        "AIRLINE_FLIGHT_NUMBER": {
          "success": true,
          "value": "4",
        },
        "AIRLINE_RECORD_LOCATOR": {
          "success": true,
          "value": "EGEUSE",
        },
        "AIRLINE_SEAT": {
          "success": true,
          "value": "25C",
        },
        "ANIMAL_BEAR": {
          "success": true,
          "value": "Spectacled bear",
        },
        "ANIMAL_BIRD": {
          "success": true,
          "value": "Mallard",
        },
        "ANIMAL_CAT": {
          "success": true,
          "value": "Persian",
        },
        "ANIMAL_CETACEAN": {
          "success": true,
          "value": "Heaviside’s Dolphin",
        },
        "ANIMAL_COW": {
          "success": true,
          "value": "Muturu",
        },
        "ANIMAL_CROCODILIA": {
          "success": true,
          "value": "Gharial",
        },
        "ANIMAL_DOG": {
          "success": true,
          "value": "Schipperke",
        },
        "ANIMAL_FISH": {
          "success": true,
          "value": "Alaska pollock",
        },
        "ANIMAL_HORSE": {
          "success": true,
          "value": "American Cream Draft",
        },
        "ANIMAL_INSECT": {
          "success": true,
          "value": "Cuckoo wasp",
        },
        "ANIMAL_LION": {
          "success": true,
          "value": "Masai Lion",
        },
        "ANIMAL_RABBIT": {
          "success": true,
          "value": "Rex",
        },
        "ANIMAL_RODENT": {
          "success": true,
          "value": "Salta tuco-tuco",
        },
        "ANIMAL_SNAKE": {
          "success": true,
          "value": "Flat-nosed pitviper",
        },
        "ANIMAL_TYPE": {
          "success": true,
          "value": "lion",
        },
        "AWS_ARN": {
          "success": true,
          "value": "arn:aws:sqs:ap-east-1:872558283:queue6",
        },
        "AWS_REGION": {
          "success": true,
          "value": "ap-northeast-1",
        },
        "AWS_SERVICE": {
          "success": true,
          "value": "ElastiCache",
        },
        "BOOK_AUTHOR": {
          "success": true,
          "value": "JD Salinger",
        },
        "BOOK_CATEGORY": {
          "success": true,
          "value": "Science Fiction and Fantasy",
        },
        "BOOK_TITLE": {
          "success": true,
          "value": "The Jungle",
        },
        "CITY": {
          "success": true,
          "value": "Hawthorne",
        },
        "COLOR_CMYK": {
          "success": true,
          "value": "0.81,0.27,0.76,0.17",
        },
        "COLOR_COLOR_BY_C_S_S_COLOR_SPACE": {
          "success": true,
          "value": "0.5417,0.702,0.6964",
        },
        "COLOR_CSS_SUPPORTED_FUNCTION": {
          "success": true,
          "value": "rgba",
        },
        "COLOR_CSS_SUPPORTED_SPACE": {
          "success": true,
          "value": "sRGB",
        },
        "COLOR_HSL": {
          "success": true,
          "value": "172,0.23,0.54",
        },
        "COLOR_HUMAN": {
          "success": true,
          "value": "indigo",
        },
        "COLOR_HWB": {
          "success": true,
          "value": "72,0.86,0.87",
        },
        "COLOR_LAB": {
          "success": true,
          "value": "0.54789,77.8445,53.401",
        },
        "COLOR_LCH": {
          "success": true,
          "value": "0.925071,90.5,13.8",
        },
        "COLOR_RGB": {
          "success": true,
          "value": "#7fbcef",
        },
        "COLOR_SPACE": {
          "success": true,
          "value": "HSL",
        },
        "COMMERCE_DEPARTMENT": {
          "success": true,
          "value": "Computers",
        },
        "COMMERCE_ISBN": {
          "success": true,
          "value": "978-0-01-239199-0",
        },
        "COMMERCE_PRODUCT": {
          "success": true,
          "value": "Towels",
        },
        "COMMERCE_PRODUCT_DESCRIPTION": {
          "success": true,
          "value": "The Apollotech B340 is an affordable wireless mouse with reliable connectivity, 12 months battery life and modern design",
        },
        "COMMERCE_PRODUCT_MATERIAL": {
          "success": true,
          "value": "Wooden",
        },
        "COMMERCE_PRODUCT_NAME": {
          "success": true,
          "value": "Small Steel Soap",
        },
        "COMPANY_BS": {
          "success": true,
          "value": "architect granular methodologies",
        },
        "COMPANY_BS_ADJECTIVE": {
          "success": true,
          "value": "best-of-breed",
        },
        "COMPANY_BS_BUZZ": {
          "success": true,
          "value": "architect",
        },
        "COMPANY_BS_NOUN": {
          "success": true,
          "value": "portals",
        },
        "COMPANY_BUZZ_ADJECTIVE": {
          "success": true,
          "value": "efficient",
        },
        "COMPANY_BUZZ_NOUN": {
          "success": true,
          "value": "e-markets",
        },
        "COMPANY_BUZZ_PHRASE": {
          "success": true,
          "value": "empower seamless networks",
        },
        "COMPANY_BUZZ_VERB": {
          "success": true,
          "value": "aggregate",
        },
        "COMPANY_CATCH_PHRASE": {
          "success": true,
          "value": "Secured background flexibility",
        },
        "COMPANY_CATCH_PHRASE_ADJECTIVE": {
          "success": true,
          "value": "User-friendly",
        },
        "COMPANY_CATCH_PHRASE_DESCRIPTOR": {
          "success": true,
          "value": "exuding",
        },
        "COMPANY_CATCH_PHRASE_NOUN": {
          "success": true,
          "value": "strategy",
        },
        "COMPANY_NAME": {
          "success": true,
          "value": "Zemlak Group",
        },
        "COMPANY_SUFFIXES": {
          "success": true,
          "value": "Inc",
        },
        "COUNTRY": {
          "success": true,
          "value": "Eritrea",
        },
        "COUNTRY_CODE": {
          "success": true,
          "value": "LY",
        },
        "DATABASE_COLLATION": {
          "success": true,
          "value": "cp1250_bin",
        },
        "DATABASE_COLUMN": {
          "success": true,
          "value": "name",
        },
        "DATABASE_ENGINE": {
          "success": true,
          "value": "InnoDB",
        },
        "DATABASE_MONGODB_OBJECT_ID": {
          "success": true,
          "value": "8d8a9fcc5c0e25b519cffafa",
        },
        "DATABASE_PROVIDER": {
          "success": true,
          "value": "redis",
        },
        "DATE": {
          "success": true,
          "value": "2020-05-21T04:57:14.000Z",
        },
        "DRINKS": {
          "success": true,
          "value": "Screwdriver",
        },
        "EMAIL": {
          "success": true,
          "value": "Gillian.Moore14710@flusteredsweets.com",
        },
        "ENVIRONMENT_VARIABLE": {
          "success": true,
          "value": "Aut",
        },
        "FINANCE_ACCOUNT": {
          "success": true,
          "value": "39211422",
        },
        "FINANCE_ACCOUNT_NAME": {
          "success": true,
          "value": "Personal Loan Account",
        },
        "FINANCE_CREDIT_CARD_ISSUER": {
          "success": true,
          "value": "diners_club",
        },
        "FINANCE_CRYPTO_ADDRESS": {
          "success": true,
          "value": "3JDL4qreCrtzjDFZeJGqQpWeF9PYia2STP",
        },
        "FINANCE_CURRENCY_CODE": {
          "success": true,
          "value": "CVE",
        },
        "FINANCE_CURRENCY_NAME": {
          "success": true,
          "value": "Kuwaiti Dinar",
        },
        "FINANCE_CURRENCY_SYMBOL": {
          "success": true,
          "value": "₺",
        },
        "FINANCE_IBAN": {
          "success": true,
          "value": "AD27010072176F1G85769690",
        },
        "FINANCE_MASKED_NUMBER": {
          "success": true,
          "value": "(...9138)",
        },
        "FINANCE_TRANSACTION_DESCRIPTION": {
          "success": true,
          "value": "payment transaction at Schroeder - Koss using card ending with ***(...9721) for SDG 993.42 in account ***79424088",
        },
        "FINANCE_TRANSACTION_TYPE": {
          "success": true,
          "value": "invoice",
        },
        "FOOD": {
          "success": true,
          "value": "Feta Cheese with Honey",
        },
        "FULL_ADDRESS": {
          "success": true,
          "value": "21 Jast Tunnel, Goodyear 6456, Republic of Korea",
        },
        "GENDER": {
          "success": true,
          "value": "Non-binary/non-conforming",
        },
        "GIT_BRANCH": {
          "success": true,
          "value": "array-hack",
        },
        "GIT_COMMIT_ENTRY": {
          "success": true,
          "value": "commit f6d76bed6036035688bda4ef5eb48b71d0b160ae
          Author: Louie Buckridge <Louie_Buckridge85@yahoo.com>
          Date: Mon Nov 20 23:43:49 2023 +1100

              calculate haptic system
          ",
        },
        "GIT_COMMIT_MESSAGE": {
          "success": true,
          "value": "copy multi-byte card",
        },
        "GIT_COMMIT_SHA": {
          "success": true,
          "value": "2c82fcec27daac5d6eea95f04c9ccdddcda2bfc2",
        },
        "GIT_SHORT_SHA": {
          "success": true,
          "value": "8eca0c3",
        },
        "HACKER_ABBREVIATION": {
          "success": true,
          "value": "JSON",
        },
        "HACKER_ADJECTIVE": {
          "success": true,
          "value": "solid state",
        },
        "HACKER_INGVERB": {
          "success": true,
          "value": "backing up",
        },
        "HACKER_NOUN": {
          "success": true,
          "value": "sensor",
        },
        "HACKER_PHRASE": {
          "success": true,
          "value": "Use the online OCR protocol, then you can override the primary card!",
        },
        "HACKER_VERB": {
          "success": true,
          "value": "compress",
        },
        "IMAGE": {
          "success": true,
          "value": "https://loremflickr.com/640/480/people",
        },
        "IMAGE_ABSTRACT": {
          "success": true,
          "value": "https://loremflickr.com/640/480/abstract",
        },
        "IMAGE_ANIMALS": {
          "success": true,
          "value": "https://loremflickr.com/640/480/animals",
        },
        "IMAGE_AVATAR": {
          "success": true,
          "value": "https://avatars.githubusercontent.com/u/27293335",
        },
        "IMAGE_AVATAR_GIT_HUB": {
          "success": true,
          "value": "https://avatars.githubusercontent.com/u/81402358",
        },
        "IMAGE_AVATAR_LEGACY": {
          "success": true,
          "value": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/767.jpg",
        },
        "IMAGE_BUSINESS": {
          "success": true,
          "value": "https://loremflickr.com/640/480/business",
        },
        "IMAGE_CATS": {
          "success": true,
          "value": "https://loremflickr.com/640/480/cats",
        },
        "IMAGE_CITY": {
          "success": true,
          "value": "https://loremflickr.com/640/480/city",
        },
        "IMAGE_DATA_URI": {
          "success": true,
          "value": "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%230e3df8%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E",
        },
        "IMAGE_FASHION": {
          "success": true,
          "value": "https://loremflickr.com/640/480/fashion",
        },
        "IMAGE_FOOD": {
          "success": true,
          "value": "https://loremflickr.com/640/480/food",
        },
        "IMAGE_IMAGE_URL": {
          "success": true,
          "value": "https://loremflickr.com/640/480",
        },
        "IMAGE_NATURE": {
          "success": true,
          "value": "https://loremflickr.com/640/480/nature",
        },
        "IMAGE_NIGHTLIFE": {
          "success": true,
          "value": "https://loremflickr.com/640/480/nightlife",
        },
        "IMAGE_PEOPLE": {
          "success": true,
          "value": "https://loremflickr.com/640/480/people",
        },
        "IMAGE_SPORTS": {
          "success": true,
          "value": "https://loremflickr.com/640/480/sports",
        },
        "IMAGE_TECHNICS": {
          "success": true,
          "value": "https://loremflickr.com/640/480/technics",
        },
        "IMAGE_TRANSPORT": {
          "success": true,
          "value": "https://loremflickr.com/640/480/transport",
        },
        "INDEX": {
          "success": true,
          "value": "968bab84-2c06-50d5-9538-d1f5c43b1b01",
        },
        "INTERNET_AVATAR": {
          "success": true,
          "value": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1021.jpg",
        },
        "INTERNET_COLOR": {
          "success": true,
          "value": "#673c38",
        },
        "INTERNET_DISPLAY_NAME": {
          "success": true,
          "value": "Rolando.Cruickshank0",
        },
        "INTERNET_DOMAIN_NAME": {
          "success": true,
          "value": "impossible-condominium.name",
        },
        "INTERNET_DOMAIN_SUFFIX": {
          "success": true,
          "value": "com",
        },
        "INTERNET_DOMAIN_WORD": {
          "success": true,
          "value": "bulky-lay",
        },
        "INTERNET_EMOJI": {
          "success": true,
          "value": "😍",
        },
        "INTERNET_HTTP_METHOD": {
          "success": true,
          "value": "DELETE",
        },
        "INTERNET_HTTP_STATUS_CODE": {
          "success": true,
          "value": "305",
        },
        "INTERNET_IPV4": {
          "success": true,
          "value": "38.169.51.76",
        },
        "INTERNET_IPV6": {
          "success": true,
          "value": "bf1b:fc05:5018:2d0b:d8a8:3abf:6edd:ecd4",
        },
        "INTERNET_PORT": {
          "success": true,
          "value": "48170",
        },
        "INTERNET_PROTOCOL": {
          "success": true,
          "value": "http",
        },
        "IP_ADDRESS": {
          "success": true,
          "value": "226.204.203.201",
        },
        "LICENSE_PLATE": {
          "success": true,
          "value": "EB82YFH",
        },
        "LOCATION_BUILDING_NUMBER": {
          "success": true,
          "value": "6403",
        },
        "LOCATION_DIRECTION": {
          "success": true,
          "value": "Northeast",
        },
        "LOCATION_LATITUDE": {
          "success": true,
          "value": "49",
        },
        "LOCATION_LONGITUDE": {
          "success": true,
          "value": "49",
        },
        "LOCATION_NEARBY_G_P_S_COORDINATE": {
          "success": true,
          "value": "75.2319,-81.2788",
        },
        "MAC_ADDRESS": {
          "success": true,
          "value": "af:c7:ef:62:20:9e",
        },
        "MOTORCYCLE": {
          "success": true,
          "value": "Harley-Davidson",
        },
        "MOVIE_CHARACTER": {
          "success": true,
          "value": "Inspector Clouseau",
        },
        "MOVIE_TITLE": {
          "success": true,
          "value": "The Lord of the Rings: The Fellowship of the Ring",
        },
        "MUSIC_GENRE": {
          "success": true,
          "value": "Funk",
        },
        "MUSIC_SINGER": {
          "success": true,
          "value": "Bruce Springsteen",
        },
        "MUSIC_SONG_NAME": {
          "success": true,
          "value": "Let's Stay Together",
        },
        "PASSWORD": {
          "success": true,
          "value": "{8M7*oD%Tvr3Q",
        },
        "PERMISSION": {
          "success": true,
          "value": "no permission",
        },
        "PERSON_BIO": {
          "success": true,
          "value": "shirt junkie, student 🍈",
        },
        "PERSON_FIRST_NAME": {
          "success": true,
          "value": "Louisa",
        },
        "PERSON_FULL_NAME": {
          "success": true,
          "value": "Derrick Kuhn",
        },
        "PERSON_JOB_AREA": {
          "success": true,
          "value": "Data",
        },
        "PERSON_JOB_DESCRIPTOR": {
          "success": true,
          "value": "Lead",
        },
        "PERSON_JOB_TITLE": {
          "success": true,
          "value": "Investor Optimization Assistant",
        },
        "PERSON_JOB_TYPE": {
          "success": true,
          "value": "Liaison",
        },
        "PERSON_LAST_NAME": {
          "success": true,
          "value": "Smith",
        },
        "PERSON_MIDDLE_NAME": {
          "success": true,
          "value": "Greer",
        },
        "PERSON_PREFIX": {
          "success": true,
          "value": "Dr.",
        },
        "PERSON_SUFFIX": {
          "success": true,
          "value": "Jr.",
        },
        "PERSON_ZODIAC_SIGN": {
          "success": true,
          "value": "Cancer",
        },
        "PHONE_IMEI": {
          "success": true,
          "value": "62-240113-945267-4",
        },
        "PHONE_NUMBER": {
          "success": true,
          "value": "+122889997445492",
        },
        "POST_BODY": {
          "success": true,
          "value": "Es privatione disputatque quae iucunde etur, horreant ab natus pacemus deduceros essariae. Bonum aut ea secut pertineris augeriri est alii. Legum atione qui finibus versione res. Aut ophiae aut rerum scientia ferata, potuimur ipsa filium erit graeci divitur voluptates quae. Maxim chaere secutillas ad debensa. Poterinves comparvos praeserita dem ea, vias nihilem illa et per. It perspexit malinum firmitteneb sit ferate exisdem enter.",
        },
        "POST_COMMENT": {
          "success": true,
          "value": "Ab causa idit nec modum.",
        },
        "POST_TITLE": {
          "success": true,
          "value": "Ab causa idit nec modum.",
        },
        "RATING": {
          "success": true,
          "value": "3",
        },
        "ROLE": {
          "success": true,
          "value": "Owner",
        },
        "SCIENCE_CHEMICAL_ELEMENT_ATOMIC_NUMBER": {
          "success": true,
          "value": "49",
        },
        "SCIENCE_CHEMICAL_ELEMENT_NAME": {
          "success": true,
          "value": "Nobelium",
        },
        "SCIENCE_CHEMICAL_ELEMENT_SYMBOL": {
          "success": true,
          "value": "Cr",
        },
        "SCIENCE_UNIT_NAME": {
          "success": true,
          "value": "hertz",
        },
        "SCIENCE_UNIT_SYMBOL": {
          "success": true,
          "value": "Sv",
        },
        "SPORTS": {
          "success": true,
          "value": "Sailing",
        },
        "SPORTS_TEAM": {
          "success": true,
          "value": "Detroit Pistons",
        },
        "STATE": {
          "success": true,
          "value": "Rhode Island",
        },
        "STREET_ADDRESS": {
          "success": true,
          "value": "680 Jayde Falls",
        },
        "STRING_NANOID": {
          "success": true,
          "value": "r0WdeIDc6NS4gWEeEoCK5",
        },
        "SWIFT_CODE": {
          "success": true,
          "value": "YOOWKH4XXXX",
        },
        "SYSTEM_CRON": {
          "success": true,
          "value": "* 16 ? * 6",
        },
        "SYSTEM_DIRECTORY_PATH": {
          "success": true,
          "value": "/usr/sbin",
        },
        "SYSTEM_FILE_EXT": {
          "success": true,
          "value": "pptx",
        },
        "SYSTEM_FILE_NAME": {
          "success": true,
          "value": "who.woff2",
        },
        "SYSTEM_FILE_PATH": {
          "success": true,
          "value": "/var/tmp/godparent.def",
        },
        "SYSTEM_FILE_TYPE": {
          "success": true,
          "value": "application",
        },
        "SYSTEM_MIME_TYPE": {
          "success": true,
          "value": "image/gif",
        },
        "SYSTEM_NETWORK_INTERFACE": {
          "success": true,
          "value": "wlp5s1f8",
        },
        "SYSTEM_SEMVER": {
          "success": true,
          "value": "2.2.2",
        },
        "TIMEZONE": {
          "success": true,
          "value": "Asia/Tehran",
        },
        "TOKEN": {
          "success": true,
          "value": "968bab84-2c06-50d5-9538-d1f5c43b1b01",
        },
        "USERNAME": {
          "success": true,
          "value": "photosynthesize-pun14710",
        },
        "USER_AGENT": {
          "success": true,
          "value": "Mozilla/5.0 (Windows; U; Windows NT 5.3) AppleWebKit/536.2.0 (KHTML, like Gecko) Chrome/1658.8589.5585.0 Safari/536.2.0",
        },
        "UUID": {
          "success": true,
          "value": "968bab84-2c06-50d5-9538-d1f5c43b1b01",
        },
        "VEHICLE_BICYCLE": {
          "success": true,
          "value": "Folding Bicycle",
        },
        "VEHICLE_COLOR": {
          "success": true,
          "value": "violet",
        },
        "VEHICLE_FUEL": {
          "success": true,
          "value": "Gasoline",
        },
        "VEHICLE_MANUFACTURER": {
          "success": true,
          "value": "Nissan",
        },
        "VEHICLE_MODEL": {
          "success": true,
          "value": "Silverado",
        },
        "VEHICLE_NAME": {
          "success": true,
          "value": "Jeep Model S",
        },
        "VEHICLE_TYPE": {
          "success": true,
          "value": "Wagon",
        },
        "VEHICLE_VRM": {
          "success": true,
          "value": "EB82YFH",
        },
        "__DEFAULT": {
          "success": true,
          "value": "Ab causa idit nec modum.",
        },
      }
    `);
  });
});
