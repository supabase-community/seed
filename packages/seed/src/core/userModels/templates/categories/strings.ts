/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-base-to-string */
import { mapValues } from "remeda";
import {
  type TemplateContext,
  type TemplateFn,
  type TypeTemplates,
} from "../types.js";

export let strings: TypeTemplates = {
  EMAIL: ({ input, field }) =>
    `copycat.email(${input}, { limit: ${JSON.stringify(field.maxLength)} })`,
  USERNAME: ({ input, field }) =>
    `copycat.username(${input}, { limit: ${JSON.stringify(field.maxLength)} })`,
  FIRST_NAME: ({ input, field }) =>
    `copycat.firstName(${input}, { limit: ${JSON.stringify(
      field.maxLength,
    )} })`,
  LAST_NAME: ({ input, field }) =>
    `copycat.lastName(${input}, { limit: ${JSON.stringify(field.maxLength)} })`,
  PERSON_FIRST_NAME: ({ input, field }) =>
    `copycat.firstName(${input}, { limit: ${JSON.stringify(
      field.maxLength,
    )} })`,
  PERSON_LAST_NAME: ({ input, field }) =>
    `copycat.lastName(${input}, { limit: ${JSON.stringify(field.maxLength)} })`,
  FULL_NAME: ({ input, field }) =>
    `copycat.fullName(${input}, { limit: ${JSON.stringify(field.maxLength)} })`,
  URL: ({ input, field }) =>
    `copycat.url(${input}, { limit: ${JSON.stringify(field.maxLength)} })`,
  UUID: ({ input }) => `copycat.uuid(${input})`,
  INDEX: ({ input }) => `copycat.uuid(${input})`,
  TOKEN: ({ input }) => `copycat.uuid(${input})`,
  AGE: ({ input }) => `copycat.int(${input}, {min: 1, max: 80}).toString()`,
  NUMBER: ({ input }) => `copycat.int(${input}).toString()`,
  DATE_OF_BIRTH: ({ input }) =>
    `copycat.dateString(${input}, { maxYear: 1999 })`,
  DATE: ({ input }) => `copycat.dateString(${input}, { minYear: 2020 })`,
  GENDER: ({ input, field }) =>
    `copycat.oneOfString(${input}, ['Man', 'Woman', 'Transgender', 'Non-binary/non-conforming', 'Not specified'], { limit: ${JSON.stringify(field.maxLength)} })`,
  ZIP_CODE: ({ input }) =>
    `copycat.scramble(${input}, { preserve: ['#', '-'] })`,
  PASSWORD: ({ input }) => `copycat.password(${input})`,
  // We are still using the old model for snapshots (and old cli versions) so need both templates
  PHONE: ({ input }) => `copycat.phoneNumber(${input})`,
  PHONE_NUMBER: ({ input }) => `copycat.phoneNumber(${input})`,
  USER_AGENT: ({ input }) => `copycat.userAgent(${input})`,

  CITY: ({ input }) => `copycat.city(${input})`,
  COUNTRY: ({ input }) => `copycat.country(${input})`,
  COUNTRY_CODE: ({ input }) => `copycat.countryCode(${input})`,

  FULL_ADDRESS: ({ input }) => `copycat.postalAddress(${input})`,
  STREET_ADDRESS: ({ input }) => `copycat.streetAddress(${input})`,
  LATITUDE: ({ input }) =>
    `copycat.float(${input}, { min: -90, max: 90 }).toString()`,
  LONGITUDE: ({ input }) =>
    `copycat.float(${input}, { min: -90, max: 90 }).toString()`,
  STATE: ({ input }) => `copycat.state(${input})`,
  TIMEZONE: ({ input }) => `copycat.timezone(${input})`,

  IP_ADDRESS: ({ input }) => `copycat.ipv4(${input})`,
  MAC_ADDRESS: ({ input }) => `copycat.mac(${input})`,
  // These templates are auto generated and we can certainly improve them
  VEHICLE_VRM: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`HF74MZE\`, \`WN36XXK\`, \`BY75ILT\`, \`LY03GAD\`, \`MP72BSQ\`, \`MV58HOA\`, \`ES30UQZ\`, \`DC11FKO\`, \`HY38HKI\`, \`XV26RRG\`, \`EJ96WKP\`, \`JJ79MNA\`, \`LC49HXC\`, \`IX33DEB\`, \`NK83JZE\`, \`VD35KWM\`, \`SH64ZZA\`, \`QL46YEY\`, \`NX05RBV\`, \`LT90VIP\`, \`XI83UFB\`, \`AZ28CCR\`, \`CV23OQQ\`, \`DU56MIA\`, \`AS60SDP\`, \`NG26DWP\`, \`GN19XVP\`, \`QH93ZTV\`, \`AC76YZD\`, \`YU26JOV\`, \`MZ01ICE\`, \`WE78VTT\`, \`XA05GIX\`, \`GS06MGX\`, \`YK72QHP\`, \`YQ53BYX\`, \`RA77PVC\`, \`UM22VQF\`, \`EB82YFH\`, \`XK55YHR\`, \`CD35GCU\`, \`UF93PNL\`, \`JS97RFM\`, \`GJ42PER\`, \`XX52DFM\`, \`EZ41XDP\`, \`PV34OMM\`, \`TI57XHK\`, \`XY15ZUA\`, \`UQ79HUH\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  // We are still using the old model for snapshots (and old cli versions) so need both templates
  LICENSE_PLATE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`HF74MZE\`, \`WN36XXK\`, \`BY75ILT\`, \`LY03GAD\`, \`MP72BSQ\`, \`MV58HOA\`, \`ES30UQZ\`, \`DC11FKO\`, \`HY38HKI\`, \`XV26RRG\`, \`EJ96WKP\`, \`JJ79MNA\`, \`LC49HXC\`, \`IX33DEB\`, \`NK83JZE\`, \`VD35KWM\`, \`SH64ZZA\`, \`QL46YEY\`, \`NX05RBV\`, \`LT90VIP\`, \`XI83UFB\`, \`AZ28CCR\`, \`CV23OQQ\`, \`DU56MIA\`, \`AS60SDP\`, \`NG26DWP\`, \`GN19XVP\`, \`QH93ZTV\`, \`AC76YZD\`, \`YU26JOV\`, \`MZ01ICE\`, \`WE78VTT\`, \`XA05GIX\`, \`GS06MGX\`, \`YK72QHP\`, \`YQ53BYX\`, \`RA77PVC\`, \`UM22VQF\`, \`EB82YFH\`, \`XK55YHR\`, \`CD35GCU\`, \`UF93PNL\`, \`JS97RFM\`, \`GJ42PER\`, \`XX52DFM\`, \`EZ41XDP\`, \`PV34OMM\`, \`TI57XHK\`, \`XY15ZUA\`, \`UQ79HUH\` ], { limit: ${JSON.stringify(field.maxLength)} })`,

  VEHICLE_NAME: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Chevrolet Fortwo\`, \`Lamborghini Altima\`, \`Fiat A4\`, \`Tesla Challenger\`, \`Audi A8\`, \`Jeep 2\`, \`Fiat Camry\`, \`Hyundai Challenger\`, \`Toyota CTS\`, \`Chevrolet CTS\`, \`Smart Alpine\`, \`Toyota Altima\`, \`Chevrolet Cruze\`, \`Bugatti XTS\`, \`Bugatti Civic\`, \`BMW Alpine\`, \`Nissan Model X\`, \`Mazda XTS\`, \`Ferrari A4\`, \`Porsche Land Cruiser\`, \`Ford Colorado\`, \`Kia Durango\`, \`Rolls Royce Model T\`, \`Jeep Model S\`, \`Volkswagen Land Cruiser\`, \`Bentley CX-9\`, \`Jaguar Spyder\`, \`Lamborghini Fortwo\`, \`Kia Alpine\`, \`Polestar Camry\`, \`Jaguar Corvette\`, \`Porsche XTS\`, \`Ford Malibu\`, \`Tesla Impala\`, \`Jeep Prius\`, \`Honda Model 3\`, \`Nissan Wrangler\`, \`Volvo LeBaron\`, \`Land Rover Golf\`, \`Porsche Countach\`, \`Rolls Royce Volt\`, \`Aston Martin Model T\`, \`BMW Roadster\`, \`Aston Martin Volt\`, \`Fiat Fortwo\`, \`Chrysler Fiesta\`, \`Porsche Model Y\`, \`Mini Challenger\`, \`Smart Explorer\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  VEHICLE_TYPE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Extended Cab Pickup\`, \`Convertible\`, \`SUV\`, \`Crew Cab Pickup\`, \`Wagon\`, \`Hatchback\`, \`Passenger Van\`, \`Minivan\`, \`Coupe\`, \`Cargo Van\`, \`Sedan\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  VEHICLE_MODEL: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Model X\`, \`Volt\`, \`XTS\`, \`Golf\`, \`LeBaron\`, \`Element\`, \`Camry\`, \`Beetle\`, \`Escalade\`, \`Challenger\`, \`Model 3\`, \`Ranchero\`, \`XC90\`, \`Jetta\`, \`Mustang\`, \`V90\`, \`Roadster\`, \`A4\`, \`Explorer\`, \`Cruze\`, \`Durango\`, \`Mercielago\`, \`Model S\`, \`Silverado\`, \`1\`, \`Colorado\`, \`Model Y\`, \`Charger\`, \`Accord\`, \`Fortwo\`, \`911\`, \`ATS\`, \`Taurus\`, \`Corvette\`, \`Grand Caravan\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  VEHICLE_MANUFACTURER: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Jaguar\`, \`Cadillac\`, \`Kia\`, \`Audi\`, \`Smart\`, \`Mercedes Benz\`, \`Porsche\`, \`Chrysler\`, \`Fiat\`, \`Mini\`, \`Dodge\`, \`Tesla\`, \`Lamborghini\`, \`Hyundai\`, \`Bugatti\`, \`Mazda\`, \`Nissan\`, \`Jeep\`, \`Honda\`, \`BMW\`, \`Volkswagen\`, \`Bentley\`, \`Toyota\`, \`Chevrolet\`, \`Aston Martin\`, \`Land Rover\`, \`Ferrari\`, \`Volvo\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  VEHICLE_FUEL: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Gasoline\`, \`Hybrid\`, \`Electric\`, \`Diesel\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  VEHICLE_COLOR: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`black\`, \`orange\`, \`olive\`, \`sky blue\`, \`lavender\`, \`plum\`, \`green\`, \`turquoise\`, \`salmon\`, \`silver\`, \`magenta\`, \`mint green\`, \`gold\`, \`orchid\`, \`pink\`, \`blue\`, \`violet\`, \`grey\`, \`indigo\`, \`lime\`, \`maroon\`, \`purple\`, \`cyan\`, \`ivory\`, \`white\`, \`tan\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  VEHICLE_BICYCLE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Mountain Bicycle\`, \`Tricycle\`, \`Touring Bicycle\`, \`City Bicycle\`, \`Adventure Road Bicycle\`, \`BMX Bicycle\`, \`Triathlon/Time Trial Bicycle\`, \`Tandem Bicycle\`, \`Dual-Sport Bicycle\`, \`Hybrid Bicycle\`, \`Track/Fixed-Gear Bicycle\`, \`Cruiser Bicycle\`, \`Folding Bicycle\`, \`Cyclocross Bicycle\`, \`Road Bicycle\`, \`Flat-Foot Comfort Bicycle\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  SYSTEM_SEMVER: ({ input }) =>
    `copycat.digit( ${input} ) + '.' + copycat.digit( ${input} ) + '.' + copycat.digit( ${input} )`,
  SYSTEM_NETWORK_INTERFACE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`enp3s3f3d2\`, \`ens6\`, \`wls0f1\`, \`P5wwp1s3d3\`, \`enx9c9d735a11e8\`, \`wwo6\`, \`eno6\`, \`wlo2\`, \`wls3d8\`, \`ens2f1\`, \`eno2\`, \`ens3f3\`, \`P4enp4s0\`, \`wls5\`, \`P3wlp3s5d2\`, \`wwo4\`, \`enx12338be80377\`, \`wlo5\`, \`ens3f7d9\`, \`eno1\`, \`eno9\`, \`enx63468b41b2a0\`, \`eno7\`, \`wlp5s1f1d2\`, \`P0wlp7s2\`, \`P4wlp0s2f1d7\`, \`wlo6\`, \`wlo1\`, \`wwx14733a7c937f\`, \`ens5d3\`, \`wws9f4d6\`, \`wlp7s7d7\`, \`wws0d4\`, \`wws2f4d6\`, \`wlp5s1f8\`, \`wlxbb0594d705aa\`, \`enx5ebe54ff36d2\`, \`wlo7\`, \`enx2cf85b2776de\`, \`ens9f3\`, \`P8enp7s8f8d0\`, \`wls2f9d8\`, \`enx619b712ae075\`, \`enx8e65a4912236\`, \`wlp2s0f9\`, \`P5enp6s8f7\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  SYSTEM_MIME_TYPE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`application/vnd.rar\`, \`application/epub+zip\`, \`text/html\`, \`application/vnd.mozilla.xul+xml\`, \`image/tiff\`, \`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\`, \`application/vnd.oasis.opendocument.presentation\`, \`image/bmp\`, \`font/woff\`, \`application/x-abiword\`, \`video/ogg\`, \`application/msword\`, \`application/zip\`, \`video/webm\`, \`video/mp2t\`, \`application/vnd.ms-fontobject\`, \`image/jpeg\`, \`audio/ogg\`, \`application/vnd.apple.installer+xml\`, \`image/vnd.microsoft.icon\`, \`image/webp\`, \`application/ld+json\`, \`image/gif\`, \`font/otf\`, \`audio/mpeg\`, \`application/pdf\`, \`application/vnd.oasis.opendocument.spreadsheet\`, \`font/woff2\`, \`application/json\`, \`audio/webm\`, \`application/vnd.openxmlformats-officedocument.wordprocessingml.document\`, \`audio/3gpp2\`, \`audio/3gpp\`, \`application/rtf\`, \`application/vnd.oasis.opendocument.text\`, \`application/vnd.amazon.ebook\`, \`application/x-7z-compressed\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  SYSTEM_FILE_TYPE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`application\`, \`text\`, \`image\`, \`video\`, \`audio\`, \`font\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  SYSTEM_FILE_PATH: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`/net/exercise_yearly_quick.woff2\`, \`/proc/whenever_reliable.mp2\`, \`/home/canine_probation.xlc\`, \`/usr/till_battle.exe\`, \`/lib/enthuse_yet.oga\`, \`/usr/roughly_yet.woff\`, \`/home/user/amid_weepy.m2a\`, \`/usr/ports/noisily_mark.opus\`, \`/usr/lib/hungrily.3g2\`, \`/usr/lib/gah_worth.otf\`, \`/var/log/aboard.ics\`, \`/root/boulevard_advanced_courteous.xla\`, \`/Library/zowie_careless_asymmetry.bmp\`, \`/lost+found/beside.kar\`, \`/home/user/dir/pace.epub\`, \`/opt/include/until.xml\`, \`/var/tmp/afore.rmi\`, \`/var/log/hmph_whose.pdf\`, \`/boot/defaults/in.m2v\`, \`/selinux/gah_subsist.conf\`, \`/sys/impressive_roar.iso\`, \`/opt/include/minty.abw\`, \`/dev/pastel_as_home.mpga\`, \`/proc/indeed.mp2\`, \`/media/ick.avi\`, \`/usr/include/design_wisely_pregnancy.wav\`, \`/Users/interview.wav\`, \`/rescue/fooey_inside.m1v\`, \`/var/yp/alight_um_despite.rar\`, \`/var/yp/beside.wav\`, \`/mnt/normal_greedy.xlc\`, \`/dev/eminent.pkg\`, \`/tmp/properly_yawningly_whoever.sh\`, \`/private/tmp/if_system.tiff\`, \`/private/tmp/daily.lrf\`, \`/mnt/furthermore_unpleasant_fiercely.vsw\`, \`/usr/libexec/astride_whoa.mpkg\`, \`/usr/bin/ornament_vice.mpg4\`, \`/var/tmp/godparent.def\`, \`/selinux/or.xml\`, \`/lib/mortified.txt\`, \`/home/wary_um_punctually.jar\`, \`/home/user/dir/evenly_quirkily.dot\`, \`/System/woefully_yard.xht\`, \`/private/oof.azw\`, \`/boot/defaults/ew_majestic_sellotape.txt\`, \`/home/user/diffuse_exude.sh\`, \`/usr/sbin/justly_mmm_accrue.jar\`, \`/usr/src/internalize_dimly_enhance.iso\`, \`/usr/sbin/hie_but_appall.7z\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  SYSTEM_FILE_NAME: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`above_sandy.php\`, \`geld_joyfully.woff\`, \`spare_gosh_sturdy.rmi\`, \`justly_who.xhtml\`, \`who_whenever.so\`, \`radiate.js\`, \`finally_opposite_from.buffer\`, \`rowdy.ics\`, \`charming_restfully.so\`, \`eyebrow.3gpp\`, \`yippee.msi\`, \`near_naturally_gosh.mjs\`, \`ack_fortunate.svg\`, \`spectrum.woff\`, \`how.pot\`, \`ignorant_opposite.sh\`, \`scarcely_oh.svgz\`, \`daring.buffer\`, \`fully.xls\`, \`bowlful.ppt\`, \`dote.xul\`, \`gleefully.iso\`, \`gosh.otf\`, \`ha.mp2a\`, \`plywood_how.ico\`, \`glamorous_whoa_at.dmg\`, \`flight.ttf\`, \`whether_quarrelsomely_sharpen.3gp\`, \`piercing_courageously_encumber.csh\`, \`luxuriate_rush_conscious.ppt\`, \`slimy.htm\`, \`synthesize_wicked.mid\`, \`hemorrhage_triumphantly.m1v\`, \`before_very_yuck.ttf\`, \`gah_over_partner.midi\`, \`where.ogg\`, \`tourist_mechanism.pdf\`, \`when_zany.ttf\`, \`who.woff2\`, \`gainsay.xhtml\`, \`trap_silent.xlt\`, \`afore.zip\`, \`out_underneath.vst\`, \`sleepily_uh_huh.rmi\`, \`variant_appreciation.m2v\`, \`front.dump\`, \`grave_out_below.tiff\`, \`button.so\`, \`about_bait.pkg\`, \`beneath.mpg\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  SYSTEM_FILE_EXT: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`mp2a\`, \`odp\`, \`avif\`, \`eot\`, \`pptx\`, \`arc\`, \`sh\`, \`weba\`, \`xlm\`, \`m3a\`, \`kar\`, \`rtf\`, \`rng\`, \`htm\`, \`3gp\`, \`oga\`, \`jsonld\`, \`bz\`, \`mid\`, \`m1v\`, \`mpg4\`, \`gz\`, \`in\`, \`docx\`, \`txt\`, \`mpkg\`, \`mpeg\`, \`html\`, \`xsd\`, \`ods\`, \`json\`, \`mp3\`, \`epub\`, \`ini\`, \`m2a\`, \`aac\`, \`xht\`, \`elc\`, \`xlw\`, \`png\`, \`3g2\`, \`pps\`, \`7z\`, \`odt\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  SYSTEM_DIRECTORY_PATH: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`/tmp\`, \`/Library\`, \`/net\`, \`/dev\`, \`/boot\`, \`/lib\`, \`/sbin\`, \`/home/user/dir\`, \`/private/var\`, \`/etc/ppp\`, \`/usr/include\`, \`/etc/defaults\`, \`/etc\`, \`/Users\`, \`/Network\`, \`/usr/sbin\`, \`/usr/X11R6\`, \`/usr/ports\`, \`/usr/local/bin\`, \`/usr/bin\`, \`/usr\`, \`/var\`, \`/proc\`, \`/rescue\`, \`/boot/defaults\`, \`/var/log\`, \`/var/yp\`, \`/usr/lib\`, \`/sys\`, \`/srv\`, \`/selinux\`, \`/lost+found\`, \`/etc/namedb\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  SYSTEM_CRON: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`54 16 ? 2 *\`, \`33 * ? * *\`, \`39 * * 10 ?\`, \`* * 5 1 0\`, \`5 * ? 9 ?\`, \`51 17 * 8 ?\`, \`54 1 19 4 ?\`, \`39 * * 10 *\`, \`5 11 * * *\`, \`* 20 * * *\`, \`12 10 ? * TUE\`, \`21 21 ? * FRI\`, \`* * * 12 3\`, \`42 19 10 * SUN\`, \`14 8 ? 1 ?\`, \`* * ? 3 4\`, \`* * ? 7 SUN\`, \`4 * ? 3 1\`, \`* * ? 1 3\`, \`36 * * 7 TUE\`, \`53 * * * ?\`, \`* 5 * 1 THU\`, \`58 * ? 10 3\`, \`53 2 21 * MON\`, \`* * 23 * 6\`, \`4 * * 4 6\`, \`55 6 ? * SAT\`, \`41 * * * MON\`, \`8 11 15 * 2\`, \`* 0 27 9 1\`, \`36 7 26 * ?\`, \`* 22 * 10 1\`, \`* * ? * ?\`, \`45 20 21 * 6\`, \`32 * ? * *\`, \`38 * ? * WED\`, \`18 * ? * SAT\`, \`37 15 ? * *\`, \`* 16 ? * 6\`, \`* 12 27 * *\`, \`12 4 23 * 0\`, \`* 8 ? 7 2\`, \`44 * 2 * MON\`, \`* * ? * *\`, \`13 23 * 1 ?\`, \`6 * 12 * 4\`, \`* * * * 1\`, \`24 * * * TUE\`, \`* 15 11 9 SUN\`, \`* 10 ? 5 MON\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  STRING_NANOID: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`XQMGc4XmIhlbw9tHBZqkt\`, \`rNnSDqe2u0ctVLSxAMhgd\`, \`jEqFBjYC6MA46cPtcO9W5\`, \`rl10539KerFF5emalJRxw\`, \`VDKUU_xW0CIwGAZEGo4hx\`, \`DeUzChdWoDjs7XWZOn957\`, \`Sgh4jN_sbrGCbY7Yn9HGS\`, \`jAati7VnhJdwg6iWFmdK5\`, \`Yxm5ZsYIDHiRnDBK8nyqK\`, \`bx5OuEesj_MKdhqa95sBU\`, \`6uecV2a1f8hFFrrjo34qe\`, \`PhJZOg68fjCkmcTVARMQ-\`, \`o97_eGVGtw9uziWdfNFz3\`, \`PfqC7oNga2sc8z8DSi4Od\`, \`B3nQJ4eiTEoGxmvl48KEd\`, \`deOGDoWyQsUjWevhaiTfX\`, \`KEZzCIJasA6n1m2VrzD2b\`, \`IFR2Opufo1am67ks6vPGj\`, \`6OdTr3lfndn3jALRo9v52\`, \`IIYVXuDxk0E9oLgj9UXf9\`, \`KGm88_5XdYb9T6eH5afwa\`, \`QcyAp6tY6v39IqR1Ibvmw\`, \`3YeHsJRa_fe9b1zvm0j3Y\`, \`WHrI1c-Yz7NU1RWTJdmVP\`, \`IJbJ89sBeGpUtt1cvOd4k\`, \`J1N1Xdgh2tCEw16fXv0iC\`, \`CKbDnfn-ilnBTINrj4QHo\`, \`JGXUIhejFPF_HouDwDsOV\`, \`u9kbwoUvXl_-7r3ExQ3Fk\`, \`s1EWc2o_-37-zOK8WwILL\`, \`ktZpzendKAsMyIsDkZeNP\`, \`gal7C_EddyCrnwYh0wO1-\`, \`ZQSB_C-4Mgu9Y_6jfpHTd\`, \`PxiCDPxSxOcWkBY42C2Dg\`, \`cwA7vDd3TnCe80lnvSi1t\`, \`9WKEBIj-0mkKViwA_XLFZ\`, \`JjbSLAa6a8G5hnWJUYcaq\`, \`kx36HyUSzV0w4KcbDe6xP\`, \`r0WdeIDc6NS4gWEeEoCK5\`, \`MyCuy-AEfdTahQMo6YuX0\`, \`JEnPE53pL9y-g4eS-q5q9\`, \`NAMlcOsVpxcGI4Y1nuhud\`, \`Obfh_qAI6SHJTpbbtkoto\`, \`O8sxjSH5AeGrwCs-41rT1\`, \`9atTYZxoUWXBTJDE9_mCa\`, \`hhoSDviKVcoq1LB4vbvu4\`, \`Czc5AuMCQ_3L1nrEYUt7G\`, \`ZdlrhrBw98IUSk45Pb33R\`, \`HrnPISj8CKqrL5PqdN9DF\`, \`1yzxl7BX3Ap7s2VqX0CgR\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  SCIENCE_UNIT_NAME: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ "tesla", "katal", "joule", "kilogram", "hertz", "becquerel", "weber", "second", "degree Celsius", "steradian", "sievert", "ampere", "candela", "coulomb", "watt", "gray", "meter", "kelvin", "siemens", "radian", "farad", "volt" ], { limit: ${JSON.stringify(field.maxLength)} })`,
  SCIENCE_UNIT_SYMBOL: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ "V", "Bq", "s", "sr", "A", "J", "Hz", "K", "kat", "S", "°C", "Sv", "mol", "N", "Pa", "kg", "lm", "lx", "rad", "T", "W", "m", "Ω" ], { limit: ${JSON.stringify(field.maxLength)} })`,
  SCIENCE_CHEMICAL_ELEMENT_SYMBOL: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ "Cd", "V", "Am", "Fr", "Nd", "Be", "Ac", "Mo", "P", "Fm", "Co", "U", "Te", "Tm", "Al", "Li", "Mn", "At", "Rg", "Tl", "Ba", "Bk", "Dy", "Re", "Pr", "N", "Rn", "Sg", "Pt", "Cs", "Au", "Nb", "Sb", "Ti", "Ta", "Rf", "Cr", "Ni" ], { limit: ${JSON.stringify(field.maxLength)} })`,
  SCIENCE_CHEMICAL_ELEMENT_NAME: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ "Rhenium", "Plutonium", "Neptunium", "Lead", "Indium", "Iodine", "Phosphorus", "Fluorine", "Neodymium", "Promethium", "Americium", "Moscovium", "Titanium", "Nitrogen", "Chlorine", "Osmium", "Seaborgium", "Yttrium", "Rubidium", "Francium", "Magnesium", "Zirconium", "Einsteinium", "Boron", "Samarium", "Palladium", "Germanium", "Lutetium", "Nobelium", "Vanadium", "Bohrium", "Rhodium", "Copernicium", "Livermorium", "Praseodymium", "Potassium", "Gold", "Neon", "Bismuth", "Tennessine" ], { limit: ${JSON.stringify(field.maxLength)} })`,
  SCIENCE_CHEMICAL_ELEMENT_ATOMIC_NUMBER: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ "31", "24", "101", "92", "97", "23", "37", "75", "82", "3", "64", "76", "12", "7", "72", "99", "51", "13", "55", "115", "34", "47", "6", "33", "41", "9", "60", "56", "54", "26", "49", "17", "91", "66", "70", "103", "36", "112", "89", "29", "67", "16" ], { limit: ${JSON.stringify(field.maxLength)} })`,
  PHONE_IMEI: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`55-764687-114170-8\`, \`86-905344-414118-7\`, \`21-385919-401555-0\`, \`70-715779-190455-4\`, \`18-476721-301697-7\`, \`73-162885-582392-2\`, \`61-244143-698015-1\`, \`93-563131-705515-2\`, \`17-897204-912637-4\`, \`10-968603-259233-5\`, \`07-428391-575294-6\`, \`80-225913-888433-5\`, \`93-020945-139268-4\`, \`53-794401-285696-0\`, \`10-890026-309791-9\`, \`25-308773-200527-8\`, \`30-112121-512907-3\`, \`15-959686-998233-6\`, \`75-561623-316343-5\`, \`35-998590-443017-9\`, \`90-271950-018590-9\`, \`56-208649-559906-9\`, \`23-614740-380363-3\`, \`60-058393-745629-0\`, \`64-306499-036165-0\`, \`52-638795-061178-6\`, \`62-429706-520861-1\`, \`59-070758-851857-7\`, \`82-545462-904184-1\`, \`36-891550-352961-7\`, \`50-246144-232590-5\`, \`67-372544-758208-9\`, \`43-402180-582033-1\`, \`60-636407-399634-8\`, \`62-086406-750203-8\`, \`23-409892-802998-4\`, \`37-987840-302625-7\`, \`69-693028-666991-3\`, \`62-240113-945267-4\`, \`58-005678-292199-3\`, \`21-819066-615337-1\`, \`62-028448-323119-7\`, \`22-778910-557844-2\`, \`58-176486-704701-9\`, \`72-305071-839902-6\`, \`67-593184-525004-2\`, \`16-624983-840249-6\`, \`09-129610-978380-7\`, \`81-252452-030583-7\`, \`08-668399-774704-3\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  PERSON_ZODIAC_SIGN: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Cancer\`, \`Aries\`, \`Gemini\`, \`Aquarius\`, \`Capricorn\`, \`Leo\`, \`Libra\`, \`Taurus\`, \`Sagittarius\`, \`Virgo\`, \`Pisces\`, \`Scorpio\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  PERSON_SUFFIX: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`V\`, \`II\`, \`Sr.\`, \`III\`, \`Jr.\`, \`MD\`, \`I\`, \`DVM\`, \`PhD\`, \`DDS\`, \`IV\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  PERSON_PREFIX: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Mrs.\`, \`Miss\`, \`Mr.\`, \`Dr.\`, \`Ms.\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  PERSON_MIDDLE_NAME: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Bowie\`, \`Addison\`, \`Elliott\`, \`Ryan\`, \`Anderson\`, \`Riley\`, \`Emerson\`, \`Leslie\`, \`Jaden\`, \`Jordan\`, \`Cameron\`, \`Rowan\`, \`Parker\`, \`Nico\`, \`Hayden\`, \`Brooklyn\`, \`Jamie\`, \`Sasha\`, \`Shawn\`, \`Avery\`, \`Sage\`, \`Quinn\`, \`Greer\`, \`Harper\`, \`James\`, \`Reese\`, \`Robin\`, \`Noah\`, \`London\`, \`Kai\`, \`Gray\`, \`Phoenix\`, \`Finley\`, \`Arden\`, \`Bailey\`, \`Rory\`, \`Charlie\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  PERSON_JOB_TYPE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Director\`, \`Facilitator\`, \`Analyst\`, \`Engineer\`, \`Supervisor\`, \`Technician\`, \`Strategist\`, \`Agent\`, \`Developer\`, \`Liaison\`, \`Coordinator\`, \`Administrator\`, \`Associate\`, \`Architect\`, \`Assistant\`, \`Executive\`, \`Manager\`, \`Representative\`, \`Specialist\`, \`Officer\`, \`Consultant\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  PERSON_JOB_TITLE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Principal Data Orchestrator\`, \`International Factors Executive\`, \`Global Group Architect\`, \`Regional Usability Consultant\`, \`Global Usability Technician\`, \`Future Marketing Orchestrator\`, \`Central Mobility Assistant\`, \`Internal Program Associate\`, \`Product Factors Liaison\`, \`Internal Quality Liaison\`, \`Principal Directives Designer\`, \`Corporate Program Administrator\`, \`Corporate Integration Analyst\`, \`Human Division Assistant\`, \`Direct Creative Technician\`, \`Customer Interactions Technician\`, \`Global Program Strategist\`, \`Corporate Data Liaison\`, \`Principal Program Representative\`, \`Legacy Group Engineer\`, \`Regional Research Analyst\`, \`Lead Marketing Director\`, \`Customer Tactics Designer\`, \`Future Marketing Engineer\`, \`Forward Group Designer\`, \`Human Data Assistant\`, \`Regional Functionality Technician\`, \`Chief Program Analyst\`, \`District Directives Liaison\`, \`Corporate Brand Supervisor\`, \`Dynamic Implementation Specialist\`, \`Internal Communications Technician\`, \`Customer Applications Specialist\`, \`Global Assurance Executive\`, \`Lead Configuration Facilitator\`, \`Regional Accountability Architect\`, \`Global Identity Facilitator\`, \`Principal Markets Supervisor\`, \`Investor Optimization Assistant\`, \`Future Metrics Designer\`, \`Senior Infrastructure Director\`, \`Internal Marketing Facilitator\`, \`Central Data Planner\`, \`Global Accountability Supervisor\`, \`Product Communications Engineer\`, \`Product Response Consultant\`, \`Principal Intranet Planner\`, \`Investor Usability Coordinator\`, \`Legacy Factors Coordinator\`, \`Forward Usability Orchestrator\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  PERSON_JOB_DESCRIPTOR: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`National\`, \`Chief\`, \`Product\`, \`Central\`, \`Legacy\`, \`International\`, \`Forward\`, \`Direct\`, \`Lead\`, \`Principal\`, \`Corporate\`, \`Internal\`, \`Global\`, \`Dynamic\`, \`Human\`, \`Investor\`, \`Regional\`, \`Senior\`, \`Customer\`, \`Future\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  PERSON_JOB_AREA: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Brand\`, \`Operations\`, \`Infrastructure\`, \`Intranet\`, \`Group\`, \`Usability\`, \`Implementation\`, \`Assurance\`, \`Quality\`, \`Division\`, \`Paradigm\`, \`Functionality\`, \`Program\`, \`Integration\`, \`Security\`, \`Web\`, \`Factors\`, \`Mobility\`, \`Data\`, \`Identity\`, \`Optimization\`, \`Research\`, \`Metrics\`, \`Creative\`, \`Marketing\`, \`Accountability\`, \`Accounts\`, \`Markets\`, \`Communications\`, \`Applications\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  PERSON_FULL_NAME: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Verna Morissette\`, \`Orlando Hamill\`, \`Carl Weissnat\`, \`Jill Shanahan\`, \`Alonzo Jacobs MD\`, \`Dr. Candace Champlin\`, \`Kirk Marvin\`, \`Lucas Bechtelar\`, \`Hector Reilly\`, \`Henry Schroeder\`, \`Mr. Earnest Gislason\`, \`Owen Cruickshank\`, \`Mrs. Sadie Russel\`, \`Bonnie Gusikowski\`, \`Mr. Lance Franey\`, \`Dr. Raymond Denesik\`, \`Lee Lang\`, \`Miss Casey Douglas\`, \`Tonya Williamson-Shanahan\`, \`Mr. Dan Conn\`, \`Rosemary Gerhold\`, \`Armando Franey\`, \`Sophie Jenkins Jr.\`, \`Darin Howell\`, \`Lucia DuBuque\`, \`Christopher Baumbach Sr.\`, \`Sally Reichert\`, \`Darrell Konopelski DVM\`, \`Aaron Beahan MD\`, \`Celia Farrell\`, \`Boyd Boyer\`, \`Ms. Peggy Thiel\`, \`Clayton Cummerata I\`, \`Joshua Bergnaum\`, \`Irvin Franecki\`, \`Clyde Stark PhD\`, \`Ida Dicki\`, \`Donna Bernier V\`, \`Derrick Kuhn\`, \`Tommie Brakus\`, \`Billy Okuneva\`, \`Elaine Schmeler\`, \`Monica Halvorson\`, \`Mrs. Carole Welch\`, \`Caleb Schamberger\`, \`Johnny Kreiger\`, \`Kristine Goyette\`, \`Miss Karla O'Conner\`, \`Glen Ferry\`, \`Bernard Boyer\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  PERSON_BIO: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`platelet advocate, leader\`, \`molasses supporter\`, \`fig junkie  🦃\`, \`high advocate, activist\`, \`pug enthusiast  🍑\`, \`business owner\`, \`pseudoscience junkie, leader\`, \`lard advocate, activist\`, \`blogger, dreamer, engineer 🐥\`, \`environmentalist\`, \`leaker fan\`, \`might supporter, model 🌃\`, \`leader, film lover, activist 🧴\`, \`rooster advocate  🚜\`, \`eel advocate\`, \`designer, film lover, dreamer 🐔\`, \`person, founder, gamer 🕟\`, \`background fan, leader 💁🏽\`, \`thump enthusiast, traveler 👰🏽‍♀️\`, \`engineer, traveler\`, \`towel fan, scientist\`, \`traveler\`, \`keep supporter, patriot 👾\`, \`shirt junkie, student 🍈\`, \`excitement advocate  🎳\`, \`rethinking junkie  🛼\`, \`divide fan, entrepreneur\`, \`friend, nerd, musician 🚄\`, \`belly advocate, model\`, \`filmmaker, grad, leader\`, \`artist, patriot, scientist\`, \`philosopher\`, \`mantua devotee\`, \`quinoa supporter, scientist\`, \`elf advocate, patriot\`, \`foodie, developer\`, \`coach, model, activist 🏃🏼\`, \`foodie, veteran, designer 🚎\`, \`broccoli junkie  🇨🇦\`, \`almighty lover  🍿\`, \`lid advocate  🏅\`, \`educator\`, \`writer\`, \`undershirt lover, designer 🇧🇿\`, \`sentencing enthusiast\`, \`public speaker, streamer\`, \`activist, nerd, musician\`, \`student supporter, writer 🥻\`, \`person, coach, creator 🩳\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  MUSIC_SONG_NAME: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Doo Wop (That Thing)\`, \`Mrs Brown You've Got a Lovely Daughter\`, \`If You Leave Me Now\`, \`Lady Marmalade (Voulez-Vous Coucher Aver Moi Ce Soir?)\`, \`Hound Dog\`, \`Chattanooga Choo Choo\`, \`St George & the Dragonette\`, \`If (They Made Me a King)\`, \`Happy Together\`, \`Car Wash\`, \`Mony Mony\`, \`Kryptonite\`, \`Do Wah Diddy Diddy\`, \`U Can't Touch This\`, \`The Glow-Worm\`, \`Johnny B Goode\`, \`The Gypsy\`, \`Hungry Heart\`, \`Breaking Up is Hard to Do\`, \`Reach Out (I'll Be There)\`, \`You Don't Bring Me Flowers\`, \`It's All in the Game\`, \`Third Man Theme\`, \`I Walk the Line\`, \`You're the One That I Want\`, \`Silly Love Songs\`, \`Runaway\`, \`One Sweet Day\`, \`Shop Around\`, \`Sugar Sugar\`, \`Grease\`, \`Green River\`, \`Save the Best For Last\`, \`How Do You Mend a Broken Heart\`, \`Freak Me\`, \`Ain't That a Shame\`, \`Seasons in the Sun\`, \`Take The 'A' Train\`, \`Let's Stay Together\`, \`Yellow Rose of Texas\`, \`Keep On Loving You\`, \`My Eyes Adored You\`, \`The Streak\`, \`(Your Love Keeps Lifting Me) Higher & Higher\`, \`You Are the Sunshine of My Life\`, \`Love Child\`, \`Funkytown\`, \`Strange Fruit\`, \`Boogie Oogie Oogie\`, \`Candy Man\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  MUSIC_GENRE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Latin\`, \`Funk\`, \`Classical\`, \`Pop\`, \`Rap\`, \`Electronic\`, \`Metal\`, \`World\`, \`Jazz\`, \`Soul\`, \`Rock\`, \`Folk\`, \`Non Music\`, \`Country\`, \`Blues\`, \`Hip Hop\`, \`Reggae\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  INTERNET_PROTOCOL: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`http\`, \`https\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  INTERNET_PORT: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`64628\`, \`26144\`, \`17934\`, \`34023\`, \`56822\`, \`21196\`, \`11762\`, \`5346\`, \`32507\`, \`22513\`, \`14537\`, \`19581\`, \`28622\`, \`38428\`, \`20776\`, \`63770\`, \`19472\`, \`17155\`, \`51813\`, \`1941\`, \`15985\`, \`37385\`, \`16774\`, \`43166\`, \`62160\`, \`60909\`, \`50573\`, \`38392\`, \`17927\`, \`38210\`, \`24581\`, \`47040\`, \`1447\`, \`11262\`, \`62908\`, \`546\`, \`7265\`, \`17844\`, \`48170\`, \`62687\`, \`35282\`, \`10765\`, \`6780\`, \`63032\`, \`29534\`, \`48859\`, \`59696\`, \`59342\`, \`48485\`, \`45246\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  INTERNET_IPV6: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`f11b:d158:8a0b:6f1d:a79f:a5c5:3ffa:d765\`, \`2dcf:fd5b:962b:6aa5:ac00:59a5:2c4d:908c\`, \`29c9:5d62:c310:1b6f:8c3a:6ee8:f0be:cfbe\`, \`eed1:e69f:02f4:a61a:0de9:bf34:e473:e3f7\`, \`d490:2d35:78cb:f7d4:c2e5:2bcd:cf6f:4962\`, \`8cf3:7efb:84a8:7875:9dd6:b8d6:d2a2:3f48\`, \`6c63:a8ec:f6f6:fd7f:46f9:bf5c:fc3d:1c2d\`, \`9daa:f341:24cf:32fe:0d05:a943:baa7:ca92\`, \`e848:dd95:a2ec:b2bf:5acf:c52d:b81b:dc7c\`, \`cf96:6d9c:5db5:8a5d:59e7:dfdd:e6e2:b2f9\`, \`4c19:dbbc:eaa3:7fdf:32ee:afc1:64a9:b3dc\`, \`c7df:13b4:9092:ed6b:fe15:af7a:ec77:ed59\`, \`32fa:ebea:4083:62a8:da33:faef:5af3:fcbc\`, \`b586:ae01:7809:bf77:0a88:ffc8:a580:4cfe\`, \`cb84:5500:7efa:ea4a:ecbb:627d:775e:b9b1\`, \`afd4:a4eb:b3d1:cdae:d3d4:2c98:8a1b:ae45\`, \`bacd:dde4:4d3f:8ef3:9cc2:fccc:0060:c2ce\`, \`b944:ad91:8e26:3c3c:55fc:ddfb:a3a5:786b\`, \`fd07:18ce:de2e:df8d:56c4:bc8a:85de:6aaf\`, \`54dd:b4fc:27cc:e4a3:9e27:c3f2:8fbe:85d5\`, \`7c89:56c7:ded8:7ed2:05a1:e5f4:f51a:b098\`, \`d41a:fc9c:e340:729c:a82d:fed5:ed27:3edb\`, \`aae8:1d00:dfab:8c38:ffb4:dbb9:bebc:ab2f\`, \`0dbf:5a9d:9fa3:5945:012a:bd71:71af:028a\`, \`ec90:ccbd:fd3c:bbc7:d2da:5392:7cbb:3ed0\`, \`ebae:dcee:7e6a:a1fc:66e5:2c8c:c9eb:6e90\`, \`fcba:1784:ccda:6dfc:0b3d:cedc:7013:0a51\`, \`d04d:acf2:e02a:954b:d66e:7d33:b083:0bfd\`, \`eb05:a3f5:4a34:f5ca:f608:a521:ae09:8aab\`, \`14dc:f64c:fc75:f470:1bb9:f1e4:aa23:f53a\`, \`ddbb:36fa:a9c4:dfaf:e9f6:dc8c:aa12:d145\`, \`0b5a:31f3:669d:c64e:6fbb:7ade:caad:8717\`, \`d8bc:f17f:c89b:9dcb:adba:16cf:129e:ffeb\`, \`cfdb:6a6c:ebfb:09e5:fb7d:228d:fba9:fdae\`, \`084b:ead2:aeea:f073:55ca:117c:ceb3:be7e\`, \`eebc:5f2c:96cb:1f58:7a31:251b:e65e:fd0d\`, \`22c0:81bf:aacd:eec1:9d1e:c1cb:194d:7d9b\`, \`abd0:5a44:7bcb:bb69:7b3a:7ef0:f9b9:ac5b\`, \`bf1b:fc05:5018:2d0b:d8a8:3abf:6edd:ecd4\`, \`0f03:707b:eb2e:2e9d:59ba:aa5e:8c17:fd3a\`, \`cffc:340b:58cd:ccc6:cabb:4f41:40eb:ba70\`, \`c40c:f12e:970f:293b:0eea:a5fb:aa9c:321a\`, \`c81c:ee7a:884b:bfc0:121d:4cfa:f9c2:c85f\`, \`bbe8:bbad:dcfe:5c28:c3b1:166a:4eb2:bc81\`, \`7a79:75b1:0376:b3d9:03c2:c4ba:a2b6:ccd3\`, \`ee8f:49f4:906f:c78a:d3ac:4ff0:e3e6:8aaf\`, \`7f25:e6ee:d6ac:d558:173b:8d63:b398:8a63\`, \`1fef:45ea:44ed:d8a4:21ec:f7dc:3a34:c25b\`, \`9d0a:24ac:fa9c:c1c2:cea8:f782:aa28:221a\`, \`12dd:c78f:0cc2:ca5e:b562:c1d8:7768:b0d3\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  INTERNET_IPV4: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`159.146.250.241\`, \`154.172.251.5\`, \`68.221.9.3\`, \`218.20.123.19\`, \`159.80.130.233\`, \`33.15.220.99\`, \`97.155.131.52\`, \`111.34.120.67\`, \`39.15.188.188\`, \`4.97.101.87\`, \`141.132.140.171\`, \`138.173.167.236\`, \`20.44.107.79\`, \`199.142.126.244\`, \`81.211.43.101\`, \`98.52.249.155\`, \`44.63.107.10\`, \`225.238.110.53\`, \`147.46.77.193\`, \`233.172.153.220\`, \`174.193.26.147\`, \`77.202.237.179\`, \`227.69.161.182\`, \`236.176.129.183\`, \`150.34.248.119\`, \`146.62.10.139\`, \`154.69.244.204\`, \`179.246.214.202\`, \`206.98.157.175\`, \`63.53.118.213\`, \`137.237.173.140\`, \`14.203.53.81\`, \`161.1.146.48\`, \`163.81.234.231\`, \`218.107.232.108\`, \`84.53.65.223\`, \`213.243.127.207\`, \`167.34.125.184\`, \`38.169.51.76\`, \`231.118.83.182\`, \`153.132.43.84\`, \`81.96.246.24\`, \`180.93.149.148\`, \`113.129.236.86\`, \`20.171.4.28\`, \`246.120.36.51\`, \`102.56.180.176\`, \`142.115.52.181\`, \`223.198.53.105\`, \`77.167.34.123\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  INTERNET_HTTP_STATUS_CODE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`410\`, \`102\`, \`206\`, \`418\`, \`403\`, \`101\`, \`501\`, \`203\`, \`100\`, \`510\`, \`500\`, \`423\`, \`226\`, \`304\`, \`300\`, \`505\`, \`205\`, \`103\`, \`451\`, \`507\`, \`301\`, \`208\`, \`303\`, \`409\`, \`405\`, \`204\`, \`201\`, \`202\`, \`305\`, \`421\`, \`506\`, \`306\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  INTERNET_HTTP_METHOD: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`POST\`, \`PATCH\`, \`PUT\`, \`DELETE\`, \`GET\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  INTERNET_EMOJI: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`👃🏻\`, \`🇫🇲\`, \`🪖\`, \`♋\`, \`⛱️\`, \`✊🏻\`, \`🐻\`, \`🗃️\`, \`👨‍🌾\`, \`👢\`, \`🇸🇿\`, \`🚲\`, \`👷🏽‍♀️\`, \`🟥\`, \`🌹\`, \`🇸🇭\`, \`⛅\`, \`🔨\`, \`🪛\`, \`🕐\`, \`🎃\`, \`🦧\`, \`🛴\`, \`🇪🇷\`, \`🛩️\`, \`👩🏽‍🔧\`, \`😁\`, \`🐑\`, \`🇮🇴\`, \`👨‍🦳\`, \`🎖️\`, \`🍞\`, \`🍷\`, \`🎎\`, \`🧢\`, \`🆕\`, \`👨‍👨‍👧‍👦\`, \`🎿\`, \`😍\`, \`🎆\`, \`☔\`, \`🥥\`, \`⏬\`, \`🚂\`, \`🍟\`, \`🐀\`, \`🧉\`, \`📖\`, \`🐍\`, \`💩\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  INTERNET_DOMAIN_WORD: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`thorough-sentiment\`, \`negative-violence\`, \`frigid-target\`, \`scrawny-exasperation\`, \`stingy-inhabitant\`, \`untidy-deployment\`, \`stylish-equivalent\`, \`idealistic-poppy\`, \`burdensome-clockwork\`, \`woozy-daybed\`, \`unselfish-epee\`, \`pure-slot\`, \`light-certificate\`, \`critical-step-uncle\`, \`tasty-dune\`, \`other-mangle\`, \`nervous-civilisation\`, \`warm-innovation\`, \`actual-respect\`, \`kooky-ant\`, \`robust-family\`, \`mysterious-happiness\`, \`hard-to-find-effector\`, \`false-duel\`, \`cloudy-pancake\`, \`violent-consequence\`, \`untimely-disposition\`, \`half-fit\`, \`double-mug\`, \`perfect-physical\`, \`super-literate\`, \`earnest-concrete\`, \`sweet-mall\`, \`grim-sonnet\`, \`snoopy-canvas\`, \`ornery-stacking\`, \`submissive-measurement\`, \`wild-fanlight\`, \`bulky-lay\`, \`heavy-chamber\`, \`clear-bee\`, \`dull-salmon\`, \`qualified-kiss\`, \`remote-raise\`, \`soggy-frog\`, \`slippery-friction\`, \`simple-individual\`, \`overdue-connotation\`, \`incredible-notebook\`, \`pointless-risk\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  INTERNET_DOMAIN_SUFFIX: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`com\`, \`name\`, \`org\`, \`net\`, \`info\`, \`biz\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  INTERNET_DOMAIN_NAME: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`clumsy-foray.name\`, \`unsung-cable.com\`, \`tan-dragster.info\`, \`incomparable-obligation.name\`, \`short-quit.biz\`, \`muddy-jump.biz\`, \`able-micronutrient.com\`, \`dim-chairperson.com\`, \`handy-rise.net\`, \`right-body.net\`, \`lone-sepal.com\`, \`funny-reputation.biz\`, \`utilized-hop.net\`, \`stormy-evaluation.biz\`, \`impartial-command.com\`, \`slow-stretch.com\`, \`spherical-cabana.net\`, \`tender-analogy.com\`, \`admirable-handle.name\`, \`modern-arch-rival.name\`, \`eager-keep.net\`, \`wee-trail.net\`, \`automatic-netball.biz\`, \`unsung-softdrink.org\`, \`accomplished-sediment.com\`, \`showy-sorghum.net\`, \`fine-initiative.com\`, \`nippy-gateway.org\`, \`profitable-blog.biz\`, \`anguished-diagnosis.name\`, \`cool-amendment.com\`, \`sugary-termination.com\`, \`needy-lord.org\`, \`fragrant-tortilla.com\`, \`incredible-tuber.info\`, \`grown-charity.com\`, \`grandiose-slash.net\`, \`grand-privilege.biz\`, \`impossible-condominium.name\`, \`illiterate-park.info\`, \`fantastic-cornet.info\`, \`outlying-legal.name\`, \`pitiful-footprint.org\`, \`giving-democrat.org\`, \`smoggy-hybridisation.net\`, \`bruised-cadet.info\`, \`downright-soul.org\`, \`cruel-tire.biz\`, \`first-poison.org\`, \`posh-verve.info\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  INTERNET_DISPLAY_NAME: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Kaleb_Kautzer\`, \`Rosetta_Bauch\`, \`Henry_Ullrich\`, \`Corbin.Blanda88\`, \`Reed_Kuphal\`, \`Jannie_Cassin\`, \`Dovie.Auer33\`, \`Kylie_Koelpin85\`, \`Stephan.Pagac49\`, \`Antoinette_Waters\`, \`Elenor45\`, \`Max.Fahey80\`, \`Alvah_Schimmel\`, \`Christopher.Reichert\`, \`Agnes.Wiegand56\`, \`Harley_Schaefer56\`, \`Jordane65\`, \`Meghan91\`, \`Justyn_Rice\`, \`Esther.Spencer\`, \`Wilhelm_Smith\`, \`Vergie_Schaden24\`, \`Skyla54\`, \`Micaela.Barrows99\`, \`Beau.Cronin68\`, \`Ellsworth84\`, \`Veda28\`, \`Bettye68\`, \`Narciso24\`, \`Keira22\`, \`Reyes_Okuneva\`, \`Buster35\`, \`Sim.Walsh\`, \`Keely_Klocko\`, \`Cleve.Windler20\`, \`Nicolas.Adams\`, \`Harry64\`, \`Leta55\`, \`Rolando.Cruickshank0\`, \`Dallas_Hessel94\`, \`Nils_Davis\`, \`Vivianne_Carter26\`, \`Elisha.Hand4\`, \`Zechariah4\`, \`Kaylee.Medhurst72\`, \`Allan95\`, \`Lou96\`, \`Lina_Carroll0\`, \`Forest_Bode-VonRueden16\`, \`Ted_Watsica98\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  INTERNET_COLOR: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`#453e36\`, \`#737d39\`, \`#7b6540\`, \`#557b23\`, \`#6a331f\`, \`#44124a\`, \`#133b69\`, \`#756430\`, \`#281e7c\`, \`#5c425e\`, \`#106468\`, \`#484f1f\`, \`#036c7d\`, \`#163a5c\`, \`#2b5d18\`, \`#1c6a75\`, \`#2e5f5b\`, \`#4e0f61\`, \`#0c4b7c\`, \`#5e1601\`, \`#2b3009\`, \`#7e196f\`, \`#587840\`, \`#18305e\`, \`#0e3139\`, \`#6f2d04\`, \`#3d5819\`, \`#093a64\`, \`#123d13\`, \`#24517d\`, \`#412927\`, \`#421279\`, \`#6d7071\`, \`#7c4912\`, \`#124f6a\`, \`#6c3265\`, \`#13107b\`, \`#5d383b\`, \`#673c38\`, \`#5c590d\`, \`#3e6b0c\`, \`#544c6c\`, \`#211764\`, \`#0c557c\`, \`#3e0227\`, \`#6b2e0e\`, \`#634d40\`, \`#49424d\`, \`#790568\`, \`#401552\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  INTERNET_AVATAR: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/928.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/839.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/675.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/263.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/621.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1116.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/105.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1221.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1128.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/291.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/253.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/502.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/527.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/708.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/878.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/569.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/493.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/89.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/398.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/206.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/495.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/515.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/921.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1021.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/811.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/556.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/242.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/648.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1066.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/189.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/989.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/351.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1235.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/145.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/116.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1063.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1053.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/910.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1125.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/251.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/762.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/533.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1225.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/73.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/940.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/276.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/746.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/652.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/801.jpg\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_TRANSPORT: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://loremflickr.com/640/480/transport\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_TECHNICS: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://loremflickr.com/640/480/technics\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_SPORTS: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://loremflickr.com/640/480/sports\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_PEOPLE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://loremflickr.com/640/480/people\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_NIGHTLIFE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://loremflickr.com/640/480/nightlife\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_NATURE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://loremflickr.com/640/480/nature\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_IMAGE_URL: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://loremflickr.com/640/480\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://loremflickr.com/640/480/transport\`, \`https://loremflickr.com/640/480/animals\`, \`https://loremflickr.com/640/480/nightlife\`, \`https://loremflickr.com/640/480/people\`, \`https://loremflickr.com/640/480/city\`, \`https://loremflickr.com/640/480/fashion\`, \`https://loremflickr.com/640/480/sports\`, \`https://loremflickr.com/640/480/cats\`, \`https://loremflickr.com/640/480/abstract\`, \`https://loremflickr.com/640/480/food\`, \`https://loremflickr.com/640/480/business\`, \`https://loremflickr.com/640/480/nature\`, \`https://loremflickr.com/640/480/technics\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_FOOD: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://loremflickr.com/640/480/food\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_FASHION: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://loremflickr.com/640/480/fashion\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_DATA_URI: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%232edcaf%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%234a6068%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%237cdf26%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23edaee6%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23ccb20a%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%239aaddd%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%234f295f%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23a84ede%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%234ef7ef%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%2369e4b4%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23edbbfc%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23f6c5cc%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23e6e801%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%239bfff3%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23fa5fda%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23cc6bc4%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23602d0c%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23c3eacd%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%238c3e39%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%230cc8b0%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23d77ca0%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23ba8e00%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23e6e0fd%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%235b6a6d%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23276c49%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23cc2dfb%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23da48c9%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%235bc3cf%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23ecc8d6%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%238d0638%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%2323bc0a%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23e707d9%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23a28dbe%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23abb69d%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23e93aaa%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%236cc854%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%237fc01e%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%239d6cf6%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%230e3df8%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23fc2293%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23a10c5a%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23af6bab%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%239d217e%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23c4e4ec%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%2351ea19%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23de4aae%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%230e2a80%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23ccb6e8%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23ddcb8d%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\`, \`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20baseProfile%3D%22full%22%20width%3D%22640%22%20height%3D%22480%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23b3fe9d%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22240%22%20font-size%3D%2220%22%20alignment-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22white%22%3E640x480%3C%2Ftext%3E%3C%2Fsvg%3E\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_CITY: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://loremflickr.com/640/480/city\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_CATS: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://loremflickr.com/640/480/cats\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_BUSINESS: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://loremflickr.com/640/480/business\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_AVATAR_LEGACY: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/452.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/905.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/973.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1177.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/943.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/55.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1036.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/946.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/756.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/634.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/336.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/42.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/51.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/167.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/476.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/638.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/148.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/74.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/826.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/445.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/929.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/665.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/468.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1023.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1203.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/655.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/805.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/804.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1243.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1064.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/990.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/569.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/111.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1002.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/66.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/164.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/37.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/347.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/767.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/837.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/86.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/738.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/572.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/68.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/984.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/319.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/602.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/598.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/858.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/561.jpg\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_AVATAR_GIT_HUB: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://avatars.githubusercontent.com/u/17452075\`, \`https://avatars.githubusercontent.com/u/74960407\`, \`https://avatars.githubusercontent.com/u/36286393\`, \`https://avatars.githubusercontent.com/u/96379410\`, \`https://avatars.githubusercontent.com/u/93525069\`, \`https://avatars.githubusercontent.com/u/59452028\`, \`https://avatars.githubusercontent.com/u/35365249\`, \`https://avatars.githubusercontent.com/u/64395559\`, \`https://avatars.githubusercontent.com/u/8305321\`, \`https://avatars.githubusercontent.com/u/79053895\`, \`https://avatars.githubusercontent.com/u/33331800\`, \`https://avatars.githubusercontent.com/u/83482244\`, \`https://avatars.githubusercontent.com/u/87271128\`, \`https://avatars.githubusercontent.com/u/5789181\`, \`https://avatars.githubusercontent.com/u/24376454\`, \`https://avatars.githubusercontent.com/u/73137967\`, \`https://avatars.githubusercontent.com/u/77466678\`, \`https://avatars.githubusercontent.com/u/50207285\`, \`https://avatars.githubusercontent.com/u/62355946\`, \`https://avatars.githubusercontent.com/u/6786538\`, \`https://avatars.githubusercontent.com/u/64169444\`, \`https://avatars.githubusercontent.com/u/94629915\`, \`https://avatars.githubusercontent.com/u/46861\`, \`https://avatars.githubusercontent.com/u/8762805\`, \`https://avatars.githubusercontent.com/u/72492285\`, \`https://avatars.githubusercontent.com/u/79606394\`, \`https://avatars.githubusercontent.com/u/83549996\`, \`https://avatars.githubusercontent.com/u/60218231\`, \`https://avatars.githubusercontent.com/u/60593847\`, \`https://avatars.githubusercontent.com/u/86000582\`, \`https://avatars.githubusercontent.com/u/84039227\`, \`https://avatars.githubusercontent.com/u/75770032\`, \`https://avatars.githubusercontent.com/u/12694075\`, \`https://avatars.githubusercontent.com/u/46742157\`, \`https://avatars.githubusercontent.com/u/40312502\`, \`https://avatars.githubusercontent.com/u/27856361\`, \`https://avatars.githubusercontent.com/u/54390129\`, \`https://avatars.githubusercontent.com/u/19418114\`, \`https://avatars.githubusercontent.com/u/81402358\`, \`https://avatars.githubusercontent.com/u/56704528\`, \`https://avatars.githubusercontent.com/u/64930320\`, \`https://avatars.githubusercontent.com/u/86666539\`, \`https://avatars.githubusercontent.com/u/92561787\`, \`https://avatars.githubusercontent.com/u/88278013\`, \`https://avatars.githubusercontent.com/u/46116133\`, \`https://avatars.githubusercontent.com/u/78245589\`, \`https://avatars.githubusercontent.com/u/56090842\`, \`https://avatars.githubusercontent.com/u/32672186\`, \`https://avatars.githubusercontent.com/u/91981202\`, \`https://avatars.githubusercontent.com/u/3496912\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_AVATAR: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/258.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1020.jpg\`, \`https://avatars.githubusercontent.com/u/57007432\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/297.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/355.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/302.jpg\`, \`https://avatars.githubusercontent.com/u/15744499\`, \`https://avatars.githubusercontent.com/u/82352916\`, \`https://avatars.githubusercontent.com/u/46773531\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/43.jpg\`, \`https://avatars.githubusercontent.com/u/21202855\`, \`https://avatars.githubusercontent.com/u/82370168\`, \`https://avatars.githubusercontent.com/u/42883592\`, \`https://avatars.githubusercontent.com/u/72346932\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/478.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/517.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/329.jpg\`, \`https://avatars.githubusercontent.com/u/81330101\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1121.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/344.jpg\`, \`https://avatars.githubusercontent.com/u/38934317\`, \`https://avatars.githubusercontent.com/u/49556089\`, \`https://avatars.githubusercontent.com/u/85836477\`, \`https://avatars.githubusercontent.com/u/14909621\`, \`https://avatars.githubusercontent.com/u/55396016\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/341.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/646.jpg\`, \`https://avatars.githubusercontent.com/u/21008371\`, \`https://avatars.githubusercontent.com/u/94248815\`, \`https://avatars.githubusercontent.com/u/49722847\`, \`https://avatars.githubusercontent.com/u/50116694\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/328.jpg\`, \`https://avatars.githubusercontent.com/u/45035578\`, \`https://avatars.githubusercontent.com/u/89457881\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/442.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1218.jpg\`, \`https://avatars.githubusercontent.com/u/54710576\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/389.jpg\`, \`https://avatars.githubusercontent.com/u/27293335\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/778.jpg\`, \`https://avatars.githubusercontent.com/u/93576042\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/128.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/213.jpg\`, \`https://avatars.githubusercontent.com/u/54225622\`, \`https://avatars.githubusercontent.com/u/19261362\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/958.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/954.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/785.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/6.jpg\`, \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/651.jpg\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_ANIMALS: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://loremflickr.com/640/480/animals\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  IMAGE_ABSTRACT: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`https://loremflickr.com/640/480/abstract\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  HACKER_VERB: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`input\`, \`hack\`, \`copy\`, \`compress\`, \`override\`, \`bypass\`, \`navigate\`, \`calculate\`, \`transmit\`, \`generate\`, \`synthesize\`, \`parse\`, \`program\`, \`connect\`, \`reboot\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  HACKER_PHRASE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`We need to parse the neural TCP monitor!\`, \`If we connect the bandwidth, we can get to the SSD circuit through the open-source CLI sensor!\`, \`The UTF8 card is down, hack the solid state array so we can generate the DNS panel!\`, \`I'll transmit the primary AGP firewall, that should program the API system!\`, \`You can't copy the feed without parsing the virtual SSL microchip!\`, \`backing up the hard drive won't do anything, we need to copy the redundant THX port!\`, \`Try to transmit the SQL protocol, maybe it will synthesize the 1080p driver!\`, \`Try to index the PCI bandwidth, maybe it will generate the digital capacitor!\`, \`parsing the capacitor won't do anything, we need to copy the auxiliary TCP card!\`, \`We need to parse the wireless USB pixel!\`, \`Use the neural RSS card, then you can program the mobile feed!\`, \`copying the matrix won't do anything, we need to reboot the neural AI hard drive!\`, \`The TCP alarm is down, input the back-end card so we can quantify the TCP alarm!\`, \`overriding the application won't do anything, we need to program the redundant API microchip!\`, \`If we quantify the program, we can get to the SCSI alarm through the solid state IP port!\`, \`Use the neural CLI alarm, then you can transmit the back-end port!\`, \`I'll program the online SDD capacitor, that should port the JBOD hard drive!\`, \`Try to index the FTP feed, maybe it will synthesize the cross-platform capacitor!\`, \`I'll reboot the bluetooth SSD interface, that should interface the ASCII card!\`, \`Try to connect the SMTP protocol, maybe it will copy the online interface!\`, \`The JSON port is down, index the bluetooth capacitor so we can parse the ASCII protocol!\`, \`We need to copy the cross-platform GB driver!\`, \`The SMS circuit is down, navigate the 1080p transmitter so we can parse the SMTP capacitor!\`, \`We need to index the haptic DRAM firewall!\`, \`bypassing the matrix won't do anything, we need to back up the open-source SCSI application!\`, \`bypassing the transmitter won't do anything, we need to back up the cross-platform GB bandwidth!\`, \`The IB circuit is down, override the digital bus so we can bypass the HDD microchip!\`, \`The RSS microchip is down, navigate the virtual microchip so we can hack the THX circuit!\`, \`overriding the card won't do anything, we need to input the digital EXE application!\`, \`You can't generate the firewall without programming the redundant HDD driver!\`, \`The API matrix is down, transmit the cross-platform monitor so we can connect the RSS firewall!\`, \`If we calculate the application, we can get to the UTF8 monitor through the virtual HEX program!\`, \`You can't copy the port without copying the multi-byte DNS program!\`, \`Try to index the OCR matrix, maybe it will transmit the haptic microchip!\`, \`Use the online SMS bandwidth, then you can bypass the 1080p sensor!\`, \`You can't copy the monitor without compressing the bluetooth ASCII card!\`, \`Try to hack the HTTP microchip, maybe it will input the bluetooth card!\`, \`Use the mobile SQL protocol, then you can generate the primary pixel!\`, \`Use the online OCR protocol, then you can override the primary card!\`, \`You can't transmit the application without transmitting the primary HEX array!\`, \`Try to bypass the CSS interface, maybe it will reboot the 1080p port!\`, \`I'll compress the online JSON matrix, that should system the SMTP port!\`, \`We need to override the bluetooth DNS card!\`, \`I'll transmit the primary EXE pixel, that should hard drive the RAM program!\`, \`The ASCII firewall is down, bypass the bluetooth interface so we can input the CSS array!\`, \`quantifying the bandwidth won't do anything, we need to navigate the redundant ADP program!\`, \`The DRAM capacitor is down, reboot the primary panel so we can generate the ADP pixel!\`, \`You can't connect the bus without transmitting the haptic HTTP program!\`, \`The OCR microchip is down, copy the bluetooth port so we can quantify the USB card!\`, \`Use the 1080p CSS application, then you can navigate the multi-byte transmitter!\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  HACKER_NOUN: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`alarm\`, \`hard drive\`, \`card\`, \`bandwidth\`, \`sensor\`, \`microchip\`, \`circuit\`, \`monitor\`, \`capacitor\`, \`array\`, \`system\`, \`driver\`, \`panel\`, \`bus\`, \`feed\`, \`firewall\`, \`application\`, \`interface\`, \`protocol\`, \`port\`, \`pixel\`, \`program\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  HACKER_INGVERB: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`hacking\`, \`calculating\`, \`parsing\`, \`overriding\`, \`programming\`, \`compressing\`, \`bypassing\`, \`synthesizing\`, \`generating\`, \`copying\`, \`transmitting\`, \`quantifying\`, \`backing up\`, \`connecting\`, \`navigating\`, \`indexing\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  HACKER_ADJECTIVE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`back-end\`, \`auxiliary\`, \`haptic\`, \`open-source\`, \`mobile\`, \`optical\`, \`solid state\`, \`online\`, \`digital\`, \`neural\`, \`wireless\`, \`redundant\`, \`bluetooth\`, \`multi-byte\`, \`1080p\`, \`virtual\`, \`primary\`, \`cross-platform\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  HACKER_ABBREVIATION: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`OCR\`, \`SSD\`, \`FTP\`, \`ADP\`, \`SQL\`, \`HEX\`, \`UTF8\`, \`USB\`, \`DNS\`, \`XSS\`, \`TLS\`, \`ASCII\`, \`CSS\`, \`AGP\`, \`HTTP\`, \`GB\`, \`DRAM\`, \`JBOD\`, \`SMS\`, \`VGA\`, \`PNG\`, \`HDD\`, \`RAM\`, \`XML\`, \`JSON\`, \`SSL\`, \`IB\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  GIT_SHORT_SHA: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`fc43adb\`, \`09fa9e1\`, \`f2fae6c\`, \`f353dd3\`, \`fa92ed3\`, \`9a55fe7\`, \`d9e4fe9\`, \`602d4fd\`, \`bee634e\`, \`e3ee4d3\`, \`d0dd1ff\`, \`f4401c1\`, \`1dbbd8e\`, \`f420fec\`, \`6e3de6d\`, \`9cc7f72\`, \`5d6ba0e\`, \`dc5477b\`, \`8e06eb0\`, \`bfddeec\`, \`52adea6\`, \`67dfc7f\`, \`e7b88c1\`, \`dfd3ec0\`, \`08cda57\`, \`fede622\`, \`bf8deab\`, \`9c6b8ee\`, \`cf0cf45\`, \`0b69e2c\`, \`5bbabe3\`, \`51ad48b\`, \`bfc1639\`, \`de9bdfc\`, \`40af9cb\`, \`187d36b\`, \`d2b4e07\`, \`5a34424\`, \`8eca0c3\`, \`d8e9efe\`, \`cc7fb6b\`, \`2dc22bd\`, \`8ebeca4\`, \`b46d0fd\`, \`e19a0fa\`, \`2609b37\`, \`dc56e40\`, \`c1562d1\`, \`1b2daa0\`, \`bcdeaee\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  GIT_COMMIT_SHA: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`b4f2ff9f9e19bddaced1814437b9e4b47bebb62d\`, \`b5cb183cdf7dce7c8bad3de9efb62e4a788bbde5\`, \`f6bffa46e42d2ba9aefe9beae4115e33dd84ab39\`, \`d4c1bb3faac4ec3ea1f6e8e5e3c6c4074d1ddedc\`, \`1e984cebfe9bd3fd7b9e6b0ddfb7eaa18e1c3156\`, \`7f6d4eceb3cc2ca2a4bf4aeeffbed5b615cfb22e\`, \`654fceac1e23998be2e6f01dc2f5fd7d0190b940\`, \`ff83db310fdad175cdebbdfb1e5a40656fdbe7fa\`, \`883ead78cc9ddd8eb2a0d90cbe1bd4c985cab40e\`, \`864a6adb70cba01f7841ecfff697d73aacdf4fd6\`, \`5a9ffadfa04c4f69beae5c3ec200b8cc7dacc309\`, \`5fcfba15a7a66bc5de7d01e09fdbe8e4fc417fd6\`, \`dbcfd7afd2be9ddb7b7f2b7de3ca6ddfed2d4c59\`, \`feaef1cbe161ca1c6f7da65e83e68fef8edd45bd\`, \`6cff8bbb2c6bfdffe49e45de70cadf5d3b1bffdd\`, \`d7aeeab3eeffea276cbcd18caaadee4ecc797a6e\`, \`1494b75f6c808a9fc1c58aeb8437acefedd7fd3f\`, \`decfc6abaefa07cdaa49538787abdacebc2e2cbf\`, \`4bfed4e2e1facf9d1f3ea586ccc4cd654c3b4349\`, \`ea56aab29efd83aaafab4afd841bceac57a7fced\`, \`672bc39b60c1eade6d51e2534f9bee9023bbd7ef\`, \`a8d90c1a72a3533b744975f29273d1fde7ab88eb\`, \`a9c2d2dfd33e37aa3a83a8a9b6b0d1bb58793abe\`, \`4cd29073eb0ed467fa8ae441cf716deeda0f3ecd\`, \`3da7cdbbd4e93badb07c41452930f4d630bf2fde\`, \`b73fed19dc370ea13ba88f56e893d8fde4b72fba\`, \`e352c2bcefaca5acb4feeebbc28571a17f5ee0cf\`, \`ac17a2e65c2bebb11f4cbeabc17beee2eceaef54\`, \`5fb5acafe7d8d1c961237e6634c745acbb8c2fff\`, \`fa7e6d8f5cde4ca95adcaacec5c88c7d9bffcb3f\`, \`a5f6cf5bc66269b27bb29fb6f5cfc415aaefe9aa\`, \`3dacda81abbdbf7f4cf444dfe5280ad5b1b2aca8\`, \`3e3dbe36eeee3beddc2aecfa4cebf8245bbc9071\`, \`f079fd4f4eec0ab38d3e38f71beea24dd7ee0d71\`, \`d1bc803ecffd7dbff1bfeba9835eb079df9001ea\`, \`3adfd3f4674f3ca9d52c7b21fe6c15cfefd52edb\`, \`d0631c49cec3bc66fdcecc0ad2ffe7efcdfe37d6\`, \`3f0b831be4f4d35cf865deee23d0aabeaeacdafb\`, \`2c82fcec27daac5d6eea95f04c9ccdddcda2bfc2\`, \`457d2dab4081b9f6729c59a5315dbdbfd7e83cf5\`, \`dc0d18cee3bc74dfefdb412292ee138fd4e7ea9d\`, \`523a5d9b26dd1ad3c1cad0aea0d47916ad9e01a1\`, \`ecf87ec27d4c9a4189042cfa9adc6bdfe3e58ebf\`, \`cb55bae421de7017a6dd28e94ab71b80e326228c\`, \`b3285c27ddddfcedfebdfc10fd1cecfea2d2e1be\`, \`0a0c6df8ded2dc05e5d33e96b1edde6f8bdc22fd\`, \`cfb4fa8e1c0d050eec0bcb6a54bbab98beeea4d8\`, \`aa4fbf6da3dc82ea846456f4fdb2bb7acff6f391\`, \`0dabddabddeecbbfec199dacd1c0abbb7702bbb5\`, \`1b306be74aeafaf807a396cd9e7610b348c9b9f5\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  GIT_COMMIT_MESSAGE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`program auxiliary capacitor\`, \`program back-end sensor\`, \`navigate back-end circuit\`, \`connect bluetooth alarm\`, \`compress haptic port\`, \`quantify 1080p panel\`, \`calculate wireless feed\`, \`quantify bluetooth port\`, \`calculate neural alarm\`, \`navigate digital bandwidth\`, \`calculate auxiliary monitor\`, \`compress multi-byte pixel\`, \`calculate digital monitor\`, \`program multi-byte hard drive\`, \`generate auxiliary program\`, \`bypass cross-platform capacitor\`, \`quantify haptic monitor\`, \`generate auxiliary array\`, \`synthesize haptic hard drive\`, \`program multi-byte bus\`, \`navigate haptic circuit\`, \`generate solid state pixel\`, \`transmit wireless circuit\`, \`input haptic array\`, \`transmit bluetooth bus\`, \`override wireless panel\`, \`copy virtual capacitor\`, \`quantify solid state bandwidth\`, \`synthesize wireless feed\`, \`bypass optical application\`, \`generate primary microchip\`, \`hack multi-byte hard drive\`, \`back up multi-byte transmitter\`, \`navigate cross-platform hard drive\`, \`program haptic sensor\`, \`copy online port\`, \`input neural application\`, \`copy cross-platform pixel\`, \`copy multi-byte card\`, \`reboot haptic feed\`, \`synthesize solid state transmitter\`, \`transmit back-end application\`, \`hack optical bandwidth\`, \`calculate primary driver\`, \`transmit open-source pixel\`, \`hack open-source array\`, \`compress cross-platform port\`, \`override digital interface\`, \`transmit bluetooth sensor\`, \`connect 1080p port\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  GIT_COMMIT_ENTRY: ({
    input,
    field,
  }) => `copycat.oneOfString( ${input} , [ \`commit 29fcb7dcd85ba033adcfe6afbaabd549a54d2ce2
    Author: Cynthia Goldner DVM <Cynthia.Goldner59@gmail.com>
    Date: Mon Nov 20 16:26:27 2023 +0700

        reboot solid state port
    \`, \`commit 2dfa7837b5aef0f4bbe6e659cab9180f8bdce96f
    Author: Sage Witting <Sage.Witting@gmail.com>
    Date: Tue Nov 21 08:04:22 2023 -1100

        parse digital card
    \`, \`commit a7ff743fdeffe7f0b7803ff5dad2af19a38cb95c
    Author: Lillie62 <Lillie28@gmail.com>
    Date: Tue Nov 21 11:42:48 2023 +0700

        compress open-source bus
    \`, \`commit 3bd4723ceca0e5eb4c8e05e432a2b7cd4caadc2f
    Author: Charley Metz <Charley.Metz90@gmail.com>
    Date: Tue Nov 21 10:47:07 2023 +1200

        index virtual firewall
    \`, \`commit eecd3816137aabefc5fedc5f38d9f150bd20cde7
    Author: Winston.Fritsch62 <Winston.Fritsch@hotmail.com>
    Date: Tue Nov 21 03:33:28 2023 +0500

        calculate primary application
    \`, \`commit bbceab67463edb9fa6fa4267c3dada3e1cfed84c
    Author: Rhoda Glover <Rhoda_Glover91@hotmail.com>
    Date: Mon Nov 20 22:13:26 2023 -0300

        compress auxiliary application
    \`, \`commit f7f5df3c1c47abffc5dae7ff3fd7f8cb5261a6a4
    Merge: da8fca1 fd7253e
    Author: Mr. Armando Friesen <Armando.Friesen55@yahoo.com>
    Date: Mon Nov 20 20:59:15 2023 +0300

        override multi-byte port
    \`, \`commit daaf76dd1ddcdaad5aafbc1be0587f6a4550e870
    Merge: cf72bcc add9700
    Author: Brandy.Keebler63 <Brandy6@yahoo.com>
    Date: Mon Nov 20 11:57:31 2023 -0300

        back up cross-platform protocol
    \`, \`commit b05cad5bff3f047a076aa68a3acdca8d3b73c23d
    Author: Brittany Rodriguez <Brittany_Rodriguez11@gmail.com>
    Date: Tue Nov 21 05:41:12 2023 -1000

        parse haptic feed
    \`, \`commit 39baa79ab6e61d3df9eba23330bcfd2882660c8d
    Author: Sabrina Zemlak <Sabrina.Zemlak@hotmail.com>
    Date: Mon Nov 20 22:53:09 2023 +0200

        back up solid state array
    \`, \`commit 33c4cf2eb7ca9ba7a7fad8c138c822daad03abe4
    Author: Dr. Chanelle Bernier <Chanelle.Bernier48@hotmail.com>
    Date: Mon Nov 20 19:54:17 2023 -0500

        bypass auxiliary panel
    \`, \`commit fe795fdebbfc9aacef7ec9a4ee1e61fb8ce6ebd0
    Author: Kiana.Heaney98 <Kiana_Heaney@yahoo.com>
    Date: Mon Nov 20 13:18:36 2023 -0100

        parse optical bus
    \`, \`commit da41322e754b0ac2dc18ceee2aef1fcd387dbd9d
    Author: Makayla Muller-Kuhic <Makayla19@hotmail.com>
    Date: Mon Nov 20 22:20:15 2023 +1000

        compress 1080p system
    \`, \`commit f3da9fdb88b1b07fcb631447e2aaafcd4dea48d9
    Author: Elwyn81 <Elwyn_Bins@yahoo.com>
    Date: Mon Nov 20 18:37:24 2023 +0600

        connect online transmitter
    \`, \`commit bdcee7bfa902f663f5641883edfc623bd0cf2e05
    Merge: 5c2bce3 ecabb9c
    Author: Dr. Cynthia Bogan <Cynthia_Bogan@gmail.com>
    Date: Mon Nov 20 12:45:37 2023 +0000

        input bluetooth firewall
    \`, \`commit cf8c4f7bdba2faa5ce8ece4f108fbebf81cbad62
    Author: Dannie.Strosin <Dannie.Strosin@yahoo.com>
    Date: Tue Nov 21 06:30:59 2023 +0900

        calculate auxiliary protocol
    \`, \`commit bbf6edf7a8caeade4aafa47c7cafdcc1cf7ad365
    Author: Merritt Hermiston Jr <Merritt.Hermiston95@yahoo.com>
    Date: Tue Nov 21 02:11:27 2023 -0400

        parse wireless circuit
    \`, \`commit fab49ce31bf2bab04ea0aa0ea5dce880bae43c5d
    Author: Trenton Swaniawski <Trenton21@yahoo.com>
    Date: Mon Nov 20 15:54:09 2023 -0400

        calculate virtual bandwidth
    \`, \`commit d44ade23490eeda72b72e8ba86e9baa3cc97bd4f
    Merge: 679dff1 6f8d77e
    Author: Cedrick Johnson <Cedrick_Johnson81@gmail.com>
    Date: Mon Nov 20 23:00:17 2023 -0800

        synthesize optical firewall
    \`, \`commit dd2f89b92eeebc75a84fcfbe1d9ffbd0a4beddcd
    Author: Taurean34 <Taurean_Robel87@gmail.com>
    Date: Tue Nov 21 10:27:43 2023 +0400

        navigate virtual capacitor
    \`, \`commit 19ec73d386e83f1d2fb2dea5fdfa8c2b1cacc31d
    Author: Bradley Zboncak <Bradley18@gmail.com>
    Date: Tue Nov 21 05:28:30 2023 +0700

        override digital port
    \`, \`commit 134177f2e21ceb4e3634dffedd14de2e0bcb5edb
    Author: Odessa Hegmann <Odessa82@gmail.com>
    Date: Mon Nov 20 18:20:55 2023 -0500

        connect optical application
    \`, \`commit fa3ecf5efea6eefebe8ba80fa3ccd685ace8a9bf
    Author: Eusebio Sauer <Eusebio_Sauer7@gmail.com>
    Date: Mon Nov 20 16:11:07 2023 +1000

        parse primary sensor
    \`, \`commit cf4c0d8abe5acb5f1dbcbf282eddccdcb1706da5
    Author: Mitchel50 <Mitchel90@yahoo.com>
    Date: Mon Nov 20 18:03:00 2023 +0800

        override bluetooth port
    \`, \`commit c1c99fcd009ffe24f2c3cd308adfcbcddbb08d82
    Author: Ryder.Bauch5 <Ryder.Bauch@gmail.com>
    Date: Tue Nov 21 03:17:10 2023 +1100

        bypass mobile feed
    \`, \`commit dff1cbee0fdef43457d934adbd17e3bd0c94ff75
    Author: Sheldon.Medhurst <Sheldon_Medhurst@yahoo.com>
    Date: Tue Nov 21 02:00:35 2023 -0400

        index primary array
    \`, \`commit 5eba1cdee9ae5da0280a6b0bdef9d8f7deaae4c9
    Author: Ubaldo.Altenwerth <Ubaldo29@hotmail.com>
    Date: Tue Nov 21 02:36:42 2023 +0300

        synthesize mobile sensor
    \`, \`commit efca9f29015e3fa89de5cfafed9c2071bebd10cf
    Merge: 3f2156f cea52ad
    Author: Marlen Hessel <Marlen27@gmail.com>
    Date: Mon Nov 20 16:34:14 2023 +0200

        navigate bluetooth bus
    \`, \`commit 7b64a5f521a861ec9bbf9871bd9bfdfc9d5c00dc
    Author: Adela85 <Adela28@hotmail.com>
    Date: Tue Nov 21 04:45:25 2023 +1200

        program virtual circuit
    \`, \`commit dc83f90fbfbbda5a897bebbfeff4e5bd90efe5eb
    Author: Dr. Susanna Connelly <Susanna.Connelly18@yahoo.com>
    Date: Tue Nov 21 02:18:18 2023 -0600

        quantify multi-byte microchip
    \`, \`commit a0cc2f71042dfdd4be1eefbceaca0ccb28da16cc
    Merge: e6a9f72 8515f30
    Author: Kayli13 <Kayli_Rosenbaum10@yahoo.com>
    Date: Tue Nov 21 04:32:12 2023 +0500

        program 1080p protocol
    \`, \`commit 0dee3fabab3de33eecabf5181e8d1f6a8feddc34
    Author: Miss Brielle Corkery <Brielle14@gmail.com>
    Date: Tue Nov 21 09:39:39 2023 -0500

        program multi-byte array
    \`, \`commit 7bcf8a3ceadd95fb1efdcf0d213d5bb2fb8f51c2
    Merge: dbbafed 9fc3b6e
    Author: Berniece_Little <Berniece55@yahoo.com>
    Date: Tue Nov 21 03:50:28 2023 -0800

        transmit digital capacitor
    \`, \`commit c47a9677ca60ccfddee5d6b157590bf0fb580d1d
    Author: Teagan.Mueller48 <Teagan53@yahoo.com>
    Date: Mon Nov 20 19:21:23 2023 -1100

        hack mobile capacitor
    \`, \`commit db88f4e7b60db4de90eaaa6e85bfa4ecced87e4b
    Author: Leonardo Weimann <Leonardo_Weimann@yahoo.com>
    Date: Tue Nov 21 11:10:12 2023 +1000

        synthesize optical matrix
    \`, \`commit 2a3ca476c5ac36740650c8f6b32ec3d3bacef240
    Author: Jeanie Rogahn-Jast MD <Jeanie31@hotmail.com>
    Date: Tue Nov 21 08:25:31 2023 -0300

        program open-source matrix
    \`, \`commit 90ebb4f9efce71f09d4fbca3b11fe9e0c0ebcc93
    Author: Yazmin.Bailey <Yazmin.Bailey15@yahoo.com>
    Date: Mon Nov 20 20:15:27 2023 -0700

        connect virtual application
    \`, \`commit 8a1dfcccfd96ea11d4f3d3de4a7dabbb363cbde0
    Merge: 1ffbffd 5ca5013
    Author: Penelope Zieme <Penelope35@hotmail.com>
    Date: Tue Nov 21 03:59:17 2023 +1100

        input open-source transmitter
    \`, \`commit f6d76bed6036035688bda4ef5eb48b71d0b160ae
    Author: Louie Buckridge <Louie_Buckridge85@yahoo.com>
    Date: Mon Nov 20 23:43:49 2023 +1100

        calculate haptic system
    \`, \`commit f0200bda7feccf5fb25c9235f2bf924d28cec60c
    Author: Alysson Bartell DDS <Alysson.Bartell@gmail.com>
    Date: Mon Nov 20 17:11:12 2023 -0400

        generate digital card
    \`, \`commit 504fbb1f3dfba93c850a0d8a03ef3fe9acf8b370
    Author: Ubaldo Muller-Skiles <Ubaldo46@gmail.com>
    Date: Mon Nov 20 20:50:14 2023 +1100

        navigate digital hard drive
    \`, \`commit 2aeb2d8caa4505dd7267595154aa7aeab4ac24f6
    Author: Hazel Cormier <Hazel.Cormier@yahoo.com>
    Date: Mon Nov 20 12:59:18 2023 -0200

        bypass haptic hard drive
    \`, \`commit 80d6becf0db5a3ef0a0822515cbeb13526b0e92a
    Merge: a39bbd0 dfffff3
    Author: Alysa Kessler <Alysa_Kessler75@gmail.com>
    Date: Tue Nov 21 11:37:57 2023 -0300

        navigate virtual firewall
    \`, \`commit aaa73acdf59bbfbc97bcaac109dd0385d8244cfc
    Merge: d53fefa c7c396f
    Author: Frederick Brakus <Frederick44@yahoo.com>
    Date: Mon Nov 20 14:01:12 2023 +1100

        input multi-byte protocol
    \`, \`commit a3a466b8914d277ff9aef9b3f4ac5acf67edb195
    Merge: 5ad432b d2b999e
    Author: Buster Huel <Buster29@gmail.com>
    Date: Mon Nov 20 18:12:22 2023 -0200

        synthesize neural capacitor
    \`, \`commit edbfaffed1f43dae3aef0eb31b77cc931eb64aff
    Merge: fc87a12 f7eac7b
    Author: Alicia28 <Alicia22@gmail.com>
    Date: Mon Nov 20 19:46:32 2023 +0800

        compress back-end application
    \`, \`commit 05a6af99dcbd4b83dc86eeccadb36afbe02cc4cd
    Author: Blaze91 <Blaze.Mayert55@hotmail.com>
    Date: Mon Nov 20 20:21:40 2023 +0300

        index bluetooth circuit
    \`, \`commit 978b99959edde7bf0cb0ec65063f0bf7f2f3d53d
    Author: Florian56 <Florian79@hotmail.com>
    Date: Tue Nov 21 00:45:39 2023 +1100

        calculate cross-platform circuit
    \`, \`commit ef60f3ba3f8f2e2a6cdb03c4d18730e2df2ce0ab
    Author: Gia Lueilwitz <Gia.Lueilwitz34@yahoo.com>
    Date: Mon Nov 20 13:14:22 2023 -1000

        calculate mobile bandwidth
    \`, \`commit ec970dddfe5dddb41ddbe82eaa962af4c0db9cd2
    Author: Beau Connelly <Beau.Connelly@hotmail.com>
    Date: Tue Nov 21 06:07:23 2023 -0900

        connect 1080p monitor
    \` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  GIT_BRANCH: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`transmitter-copy\`, \`alarm-quantify\`, \`circuit-navigate\`, \`card-program\`, \`circuit-reboot\`, \`sensor-calculate\`, \`bandwidth-index\`, \`firewall-transmit\`, \`firewall-input\`, \`circuit-parse\`, \`transmitter-parse\`, \`monitor-hack\`, \`circuit-hack\`, \`bandwidth-compress\`, \`microchip-override\`, \`pixel-generate\`, \`matrix-synthesize\`, \`panel-generate\`, \`driver-bypass\`, \`protocol-program\`, \`pixel-back-up\`, \`hard-drive-transmit\`, \`card-quantify\`, \`bus-compress\`, \`transmitter-override\`, \`feed-quantify\`, \`microchip-generate\`, \`transmitter-program\`, \`protocol-hack\`, \`card-reboot\`, \`application-transmit\`, \`feed-program\`, \`application-bypass\`, \`application-synthesize\`, \`hard-drive-back-up\`, \`driver-copy\`, \`bandwidth-generate\`, \`circuit-copy\`, \`feed-generate\`, \`system-bypass\`, \`pixel-parse\`, \`feed-copy\`, \`circuit-transmit\`, \`array-hack\`, \`transmitter-navigate\`, \`transmitter-reboot\`, \`bus-hack\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  FINANCE_TRANSACTION_TYPE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`invoice\`, \`payment\`, \`withdrawal\`, \`deposit\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  FINANCE_TRANSACTION_DESCRIPTION: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`withdrawal transaction at Predovic Inc using card ending with ***(...6210) for SBD 570.15 in account ***33786543\`, \`withdrawal transaction at Yost, McGlynn and Hauck using card ending with ***(...4579) for MVR 516.40 in account ***63036289\`, \`invoice transaction at Koelpin, Hane and O'Keefe using card ending with ***(...9008) for LAK 253.59 in account ***98652853\`, \`deposit transaction at Block, Boyer and Grady using card ending with ***(...6111) for LBP 584.89 in account ***26792776\`, \`withdrawal transaction at Greenfelder - Rohan using card ending with ***(...7184) for PKR 753.63 in account ***33866627\`, \`invoice transaction at Cole - Kemmer using card ending with ***(...8268) for FKP 121.30 in account ***54111723\`, \`withdrawal transaction at Kuphal LLC using card ending with ***(...7032) for MYR 250.19 in account ***12532765\`, \`deposit transaction at Huel Inc using card ending with ***(...6490) for INR 984.32 in account ***66754360\`, \`withdrawal transaction at Ankunding Inc using card ending with ***(...1575) for AWG 773.45 in account ***08125951\`, \`deposit transaction at Lakin - Schiller using card ending with ***(...0982) for BWP 732.96 in account ***19052201\`, \`deposit transaction at Corwin and Sons using card ending with ***(...9900) for ETB 689.16 in account ***93747799\`, \`invoice transaction at Walter Inc using card ending with ***(...2969) for QAR 306.18 in account ***43196978\`, \`deposit transaction at DuBuque, Cummerata and Ankunding using card ending with ***(...3869) for ZWL 379.54 in account ***46543572\`, \`withdrawal transaction at Rolfson - Bartoletti using card ending with ***(...1815) for MZN 104.05 in account ***47748643\`, \`payment transaction at Boehm - Baumbach using card ending with ***(...6620) for ILS 834.85 in account ***05875866\`, \`deposit transaction at Murray, Labadie and Medhurst using card ending with ***(...5649) for DKK 997.28 in account ***99176444\`, \`withdrawal transaction at Shanahan, Frami and Bailey using card ending with ***(...8690) for CRC 95.29 in account ***15884666\`, \`withdrawal transaction at Gerlach LLC using card ending with ***(...0284) for KMF 473.56 in account ***53995016\`, \`withdrawal transaction at Funk LLC using card ending with ***(...0327) for NGN 223.71 in account ***02983673\`, \`withdrawal transaction at Waelchi, Glover and Gislason using card ending with ***(...7972) for HTG 906.38 in account ***26954386\`, \`invoice transaction at Denesik, Ernser and Koch using card ending with ***(...7442) for AUD 565.83 in account ***27949203\`, \`withdrawal transaction at Ward and Sons using card ending with ***(...1348) for STN 223.96 in account ***24937086\`, \`withdrawal transaction at O'Keefe Inc using card ending with ***(...2359) for AZN 63.05 in account ***75535857\`, \`payment transaction at Corkery, Kling and Johns using card ending with ***(...8837) for LYD 518.21 in account ***71188753\`, \`withdrawal transaction at Quigley Inc using card ending with ***(...0142) for ARS 983.91 in account ***41179949\`, \`invoice transaction at Quitzon, Schimmel and McKenzie using card ending with ***(...6403) for VND 967.57 in account ***45155373\`, \`deposit transaction at Wintheiser - Lueilwitz using card ending with ***(...9376) for TJS 646.76 in account ***11733009\`, \`invoice transaction at Zboncak - Lebsack using card ending with ***(...0080) for HUF 598.45 in account ***09108284\`, \`deposit transaction at Brakus and Sons using card ending with ***(...8015) for BIF 244.97 in account ***40433620\`, \`withdrawal transaction at Dickens Inc using card ending with ***(...7395) for SAR 69.61 in account ***11926887\`, \`invoice transaction at Dietrich Inc using card ending with ***(...3666) for CUP 833.49 in account ***94949052\`, \`invoice transaction at Hyatt - Klein using card ending with ***(...4515) for STN 920.38 in account ***76409016\`, \`payment transaction at Kunde and Sons using card ending with ***(...9636) for KPW 741.78 in account ***50712756\`, \`payment transaction at Bednar - Deckow using card ending with ***(...4003) for FKP 371.76 in account ***50388723\`, \`deposit transaction at Kuhic LLC using card ending with ***(...7428) for BHD 81.95 in account ***39036910\`, \`invoice transaction at Hickle - Cassin using card ending with ***(...6239) for BDT 113.68 in account ***19009818\`, \`withdrawal transaction at Jerde and Sons using card ending with ***(...8252) for BWP 426.94 in account ***25412516\`, \`payment transaction at Schinner and Sons using card ending with ***(...9428) for SCR 736.11 in account ***90795906\`, \`payment transaction at Schroeder - Koss using card ending with ***(...9721) for SDG 993.42 in account ***79424088\`, \`invoice transaction at Hackett - Kohler using card ending with ***(...1217) for BYN 739.95 in account ***25175262\`, \`withdrawal transaction at O'Conner - Treutel using card ending with ***(...8666) for BBD 614.03 in account ***47362119\`, \`deposit transaction at Will, Wyman and Hauck using card ending with ***(...8480) for LSL 763.41 in account ***69565644\`, \`deposit transaction at Hackett - Considine using card ending with ***(...7268) for TND 49.01 in account ***96523406\`, \`invoice transaction at Bergstrom - Connelly using card ending with ***(...6072) for IDR 410.89 in account ***22993685\`, \`withdrawal transaction at Tromp, Lesch and Nienow using card ending with ***(...5944) for PHP 123.59 in account ***81157359\`, \`withdrawal transaction at Doyle, Osinski and Kertzmann using card ending with ***(...6693) for UAH 392.71 in account ***61141914\`, \`withdrawal transaction at Hudson Inc using card ending with ***(...4847) for KMF 274.65 in account ***24131647\`, \`payment transaction at Greenholt Inc using card ending with ***(...2798) for ARS 691.31 in account ***30267073\`, \`withdrawal transaction at Schultz - Yost using card ending with ***(...6455) for LKR 344.50 in account ***59530501\`, \`deposit transaction at Prosacco, Wuckert and Schulist using card ending with ***(...4748) for DJF 309.67 in account ***18236445\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  FINANCE_MASKED_NUMBER: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`(...8416)\`, \`(...4299)\`, \`(...9614)\`, \`(...0251)\`, \`(...8793)\`, \`(...9751)\`, \`(...2905)\`, \`(...8130)\`, \`(...4039)\`, \`(...4180)\`, \`(...6583)\`, \`(...8222)\`, \`(...6991)\`, \`(...2390)\`, \`(...1867)\`, \`(...8950)\`, \`(...2050)\`, \`(...5050)\`, \`(...4358)\`, \`(...7870)\`, \`(...0839)\`, \`(...2654)\`, \`(...1564)\`, \`(...3673)\`, \`(...7395)\`, \`(...0285)\`, \`(...3743)\`, \`(...3489)\`, \`(...0217)\`, \`(...9896)\`, \`(...7971)\`, \`(...6315)\`, \`(...7495)\`, \`(...9787)\`, \`(...1268)\`, \`(...8562)\`, \`(...3631)\`, \`(...4509)\`, \`(...9138)\`, \`(...7812)\`, \`(...6369)\`, \`(...8974)\`, \`(...9777)\`, \`(...5240)\`, \`(...9386)\`, \`(...7490)\`, \`(...6734)\`, \`(...0729)\`, \`(...0629)\`, \`(...2164)\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  FINANCE_IBAN: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`NO2556185108897\`, \`AZ82BIGS04880090800780052799\`, \`BR5407486110009475374055554K7\`, \`PL07783824984570014607002866\`, \`HR7102310710060705025\`, \`MU61VJIS1453012907006001013NFJ\`, \`BE50864000404189\`, \`LB717248068439582608C2O472N0\`, \`TR197002112436091257310550\`, \`MK782671569OI208483\`, \`MK2985858LB392M1B45\`, \`DE19378405362074072027\`, \`LT871901320050580433\`, \`EE129741695012253044\`, \`KW50HPHJ353102J518351Q9I930Q01\`, \`XK720042070081536007\`, \`AZ91SPTI45042040614003168040\`, \`TR488045740265290133800808\`, \`DO69QBLN41700855108888022665\`, \`PK79VMHV0033456010068002\`, \`NL45ZYGB1408885713\`, \`GB75XLHF15136393641409\`, \`SA709905MUG4H790OK329854\`, \`GL5868330020908378\`, \`MR1840079002659920390060034\`, \`DE43388006189007030304\`, \`MK420214111Y8N06145\`, \`PL72901043441000845003630073\`, \`IL302870570080040998463\`, \`FR700240607665909C64610V083\`, \`AD49188010224ZRDYGZ85198\`, \`KW72ZXTQ9L54S726529B426U949V13\`, \`BA417272596860313009\`, \`DO79JXHL83980080040057581007\`, \`PL04790009620092400908008088\`, \`BG88TXZZ0088384560245N\`, \`FO3800568300613246\`, \`MR0488003003460609231890206\`, \`AD27010072176F1G85769690\`, \`AE171914840065007212127\`, \`GR940050010N2292546XMK1Z8T1\`, \`BE37716009690027\`, \`TL483270391189068800582\`, \`GB28BFQM94008527700002\`, \`MK535438980B6460U00\`, \`HU86057800524934589100308491\`, \`XK315002307160500490\`, \`IT65V0014003007503918372XO7\`, \`PL44109007206700557006003545\`, \`JO51USIQ9003001272600200230488\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  FINANCE_CURRENCY_SYMBOL: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`$\`, \`₴\`, \`₹\`, \`₦\`, \`ƒ\`, \`K\`, \`₡\`, \`¥\`, \`Bs\`, \`Rp\`, \`₪\`, \`﷼\`, \`₮\`, \`C$\`, \`P\`, \`J$\`, \`₺\`, \`kr\`, \`лв\`, \`£\`, \`₨\`, \`руб\`, \`RD$\`, \`CHF\`, \`Db\`, \`₭\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  FINANCE_CURRENCY_NAME: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`CFA Franc BEAC\`, \`Fiji Dollar\`, \`Malaysian Ringgit\`, \`Dominican Peso\`, \`East Caribbean Dollar\`, \`Canadian Dollar\`, \`Lesotho Loti\`, \`Nuevo Sol\`, \`Congolese Franc\`, \`Lari\`, \`Surinam Dollar\`, \`Comoro Franc\`, \`Vatu\`, \`US Dollar\`, \`Jamaican Dollar\`, \`South Sudanese pound\`, \`Nepalese Rupee\`, \`Pakistan Rupee\`, \`Kenyan Shilling\`, \`Colombian Peso\`, \`Rial Omani\`, \`Convertible Marks\`, \`Pataca\`, \`Pula\`, \`New Zealand Dollar\`, \`Rand\`, \`Azerbaijanian Manat\`, \`Seychelles Rupee\`, \`Kuwaiti Dinar\`, \`Aruban Guilder\`, \`Ethiopian Birr\`, \`Afghani\`, \`Brazilian Real\`, \`Iceland Krona\`, \`Kyat\`, \`Tanzanian Shilling\`, \`Namibia Dollar\`, \`Kina\`, \`New Taiwan Dollar\`, \`Guarani\`, \`Peso Uruguayo\`, \`Dong\`, \`Somoni\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  FINANCE_CURRENCY_CODE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`TJS\`, \`MZN\`, \`CZK\`, \`EUR\`, \`GTQ\`, \`UYU\`, \`AED\`, \`NGN\`, \`PHP\`, \`XOF\`, \`KZT\`, \`NPR\`, \`SGD\`, \`SDG\`, \`RUB\`, \`NZD\`, \`GYD\`, \`MAD\`, \`LBP\`, \`RWF\`, \`ETB\`, \`XAF\`, \`HTG\`, \`UGX\`, \`TMT\`, \`CLP\`, \`ILS\`, \`MWK\`, \`BGN\`, \`AOA\`, \`CVE\`, \`TTD\`, \`QAR\`, \`CNY\`, \`LAK\`, \`BOB\`, \`KWD\`, \`COP\`, \`PAB\`, \`ZAR\`, \`RON\`, \`MXN\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  FINANCE_CREDIT_CARD_ISSUER: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`maestro\`, \`visa\`, \`diners_club\`, \`mastercard\`, \`discover\`, \`american_express\`, \`jcb\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  FINANCE_CRYPTO_ADDRESS: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`1WbTGYptygE8ZG3sjsySiaa5RuzAxMBQx\`, \`3PuueKg3kKFEox31K8nTmpCGnRsrpW\`, \`3mJKfKirrPwENiT9zHT6h4Yhj7X3\`, \`3EkDyXsewwyN89CfC8uBkMuuHK5hYTDB6sQ4U\`, \`1LPKQD3d2dULJS6xDsz1ZHYC3voZ5\`, \`3DVH2iWLoZzu7FCcmhEmXjHuYZ1ZUDAmwu\`, \`1FvofxBogKHJLd8RxonB1nLJ6HQ8hoRGwo6VB\`, \`1Jeo6d8oo7abXysovchvm3eRGzP\`, \`3TFNWxnGPY9M7QmcTiKqNrcruujaoVHh1\`, \`1aY8aGi8G3SbyDPpM1DnsUU133Nz\`, \`3PsRByUPMn4z3gCSqKVmvAvjnQPVdSZVSq\`, \`1jYtAHiGNGFhVibfwewr1Gf3YdKoTEJUSJw\`, \`1Yy6nSfsfbW8ZUjrqnAX41vPvGT5\`, \`1y9jLTmGLrJ4wJvckEdecgQTSKB3Ea1LvchusC5t\`, \`1X3h9CJsu1MJFumSthffFQZ4Kr1arV4b\`, \`1Z3bA6WVcrgAvCY7vsDwjMxzBjb9B1pDSp\`, \`3YWRFgzbbRU34a3EBAtngZJaiNRY68NqN8YdvJpZ\`, \`3ttC9x2QUk8dySuKaXNE8o4MzcnwQf2qcf6wjh3\`, \`38i1E7Ki9AJSB4BFJZ8Gx62xp92y6cA\`, \`1kUzPdpqTJsCTZjv5VhCHHZR6fP8B5fNg\`, \`3K8P4HpKwKak1bgrbta12wFQJ4Rer\`, \`3Vt2SFRRWMC14agt9XxZgU1RXB\`, \`1jMJ1GasbQDXxpVEEsCZztUciXJ\`, \`3xAvbgRwLkmQjy1ai5UNJQsgvPN23GZk3T4tnGx\`, \`3nSWUskW9GYioAnD7F78qTeqzpbpyozeEj\`, \`36APRgYYxzxvqNa3aicRJLs3jqnLbc\`, \`1S1QTLEjcCyqifZbX89NvCoq7Wwh38s\`, \`1WPUMc3b7pQFmyrvAxdptrAecu\`, \`1Umi6K4uSjghFHBdYKsiQCyNPe4B\`, \`3hYMpq12hU4krCd2fdRyMVBiuYrVHnT9\`, \`3YMLSVbJ1w4YB2P9DkXNfBkD9JEEUN6couy5g83S\`, \`1GwkMtsBj1caoy16oXhGbvkomW\`, \`1wRk1KM6uMjC68T7DPxKZURXMQk8heRa8VqL\`, \`1e92CVr3A6WdimGcVBC47KZhf3vkzoKNrqYv5HcD\`, \`3wPUsyisxsXPyUa96x5GBnRzzh72ddU8gro8w9\`, \`3PiVb97nHRZ5b4dA8S1hxeqoKs\`, \`1LiyWY6urHfPeYAim1VdJudMpTjLZuaSiXS68GW\`, \`3KKcmApZns1k1ytUmhUE4WjZRWGLycdCTN1pss\`, \`3JDL4qreCrtzjDFZeJGqQpWeF9PYia2STP\`, \`1wH5rjXJESZYASzguF19LJ8PhZGXCP9kt\`, \`3QpbyeXz3vMNP2fCJm6ykEKJiyaQH\`, \`1HdUDkuEXTKi4yNfy2KYr2rBu19o\`, \`3t1EqSGu5JajcGWRT2qzuN2CPT\`, \`3b82u622YiauYVWwMpXypabjEc1Mvq7CrZ8FHB\`, \`3fCHn3rCmxXdm6dA7rHFZwMEMnGUCZxE5jk\`, \`1syVdTgaXjtketbeh2TaJSZVyyx\`, \`1sxwcig3hnxPYWmBe3sr1ZxhNHxoSPKsYFzBHzN\`, \`3U3ewous9X25TgHByg3fRAmij3HC\`, \`3mZpdsL4Dja68nzskoyTkAziAPK\`, \`1M4cFMZoc5kQwpJiyVbEo8kJtka4Zg9JJJicY\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  SWIFT_CODE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`MJHINEOTXXX\`, \`ICPRCV5315G\`, \`RJOAPRSJ\`, \`GRPRRWY9\`, \`OPFPBYEG\`, \`BSJTSR32XXX\`, \`WTRRHRRF8OA\`, \`ELDSMCN3\`, \`IMSETJCS997\`, \`QXBXCNI7XXX\`, \`KWYREGVK\`, \`XUKWNP6V\`, \`DIIJGRZMXXX\`, \`ZYZCKGIVXXX\`, \`ROLMVAVGXBE\`, \`KOBCIMIG\`, \`PNIYMT6X\`, \`XBMEVAZQ\`, \`IMUTCZ7BGU2\`, \`MPECGFJQ\`, \`UPUMARQ8XXX\`, \`LZOWML5X699\`, \`VJQSMLFMXXX\`, \`GBMEKYRH\`, \`WNRHNRPAX03\`, \`UYOBPRMMXXX\`, \`SLRJCN8GXXX\`, \`LEGGSOKZ\`, \`GPPJADAJ\`, \`UZVLMWV2\`, \`EXUJBVYBXXX\`, \`KXJFMXPQ\`, \`SWJWIQZSXXX\`, \`HANDVUE2PVJ\`, \`HLEKTFHM\`, \`PVBQMQJR\`, \`EVJEITOX\`, \`TBNCTMZC\`, \`YOOWKH4XXXX\`, \`EPDFGDG6W2E\`, \`KYFAUS0J\`, \`TGCBUZULEWG\`, \`PLHUILNEXXX\`, \`WZVRGRWQBVB\`, \`DAQMGFAHXXX\`, \`QSCWGLNPLNN\`, \`OEQRGWGSXXX\`, \`JQKMSETA\`, \`ULCJMKMHUTF\`, \`GMPOGFKA\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  FINANCE_ACCOUNT_NAME: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Investment Account\`, \`Money Market Account\`, \`Home Loan Account\`, \`Auto Loan Account\`, \`Personal Loan Account\`, \`Savings Account\`, \`Checking Account\`, \`Credit Card Account\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  FINANCE_ACCOUNT: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`65332008\`, \`53011136\`, \`32772351\`, \`00560003\`, \`14239821\`, \`60476336\`, \`23959059\`, \`95104480\`, \`23511015\`, \`03089087\`, \`25541176\`, \`31506078\`, \`64290249\`, \`11384113\`, \`20277727\`, \`75665254\`, \`33101351\`, \`22347113\`, \`45991745\`, \`49097778\`, \`08234625\`, \`83952157\`, \`98957758\`, \`73055920\`, \`40437557\`, \`36848783\`, \`28602053\`, \`12826576\`, \`91533949\`, \`87692281\`, \`66872808\`, \`36988021\`, \`80591694\`, \`19545560\`, \`53530067\`, \`61373633\`, \`44458567\`, \`95637132\`, \`39211422\`, \`47249154\`, \`15515423\`, \`06504228\`, \`24032559\`, \`37813705\`, \`38429711\`, \`41248887\`, \`33366767\`, \`16224751\`, \`41934077\`, \`37683142\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  DATABASE_PROVIDER: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`mongodb\`, \`mysql\`, \`postgres\`, \`redis\`, \`rethinkdb\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  DATABASE_MONGODB_OBJECT_ID: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`3900a9faacb149a20ca519c0\`, \`7db3bbf8f7b6edca22ffae3e\`, \`efc006cbd7bfdf65b9b66e8c\`, \`e68a7e54a844e62f93b777f2\`, \`7f4cfb38dd6b9be7fce31ef9\`, \`bd5c15f2eda9fdf712dda45b\`, \`f7bcbdc3fe44adbb954cc7e6\`, \`cac3d40fbef4ebf94fb0e6ae\`, \`dfddf78efc80bfbbce8daa23\`, \`55a05c56233396e83b55ce25\`, \`da811adbe2c739721c4c4ddc\`, \`b34da13cf056bfad9cbd409e\`, \`ee602a081ddedfe3f4627ebd\`, \`b975578831ff9ecc6e4dd4a9\`, \`5c078bffbea6d8fd49cbc5f5\`, \`78ace8f261b3bb19eb13d1e3\`, \`f5ecd693fa9af9d46f0dc08a\`, \`aad88e888db17a29fcd0c8c8\`, \`bde5d0bf2e41ecf405b181cf\`, \`c4ff8cfbb309dccda1af66c4\`, \`ef79dfbbd3e10df05d7efaf7\`, \`587eaf0ccfbff993fd7ac7ca\`, \`f69b5ed63aa0ef45defa56cb\`, \`9c3bace010d7a2cc75a3b5cb\`, \`cb12e5b2ea5da5bad6a64087\`, \`bc56966e3c3af9c3fa91fd7c\`, \`f11db3259db247c21dce2a8c\`, \`b4f9cf59b3b4e672acad7bc6\`, \`3222d803efec9d1beb4c5adf\`, \`bcd3dff8eccc2a8bed81c11d\`, \`be037fc6fef3eab4cccfaa15\`, \`bcac53cbf4fe4af1cbe5ff42\`, \`bdedb4ffe29e8ffbb37e8d28\`, \`cf120d68bef2943507052ddb\`, \`d2b2c2a476d1877ecfbfbf3a\`, \`bb41ce3ed4b9c9ceda9b02c2\`, \`fc4ce579a42ac7df6cf54db2\`, \`f94dd79eb3ec78c8ff9badcc\`, \`8d8a9fcc5c0e25b519cffafa\`, \`3ad4c48bee7e397f01fcab7e\`, \`f3cb6aa8ecf344b1fef0fc5d\`, \`5cf215ebf1ac3ed7cecffadd\`, \`deaadbf25e80d45b5bcbb1fa\`, \`ab6babcdebdf5cc98b7dbd32\`, \`803da8ffa5af9fa1a32898cf\`, \`79e0afddad78cffa7a41d6a5\`, \`78b1ed5ea7c7e01399aaea9c\`, \`97acebd0cb34f4d6ae9d8efc\`, \`eeaf92dcb4dcdfb1af1dc978\`, \`6c9bc286fe2ab51af9f4caf9\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  DATABASE_ENGINE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`InnoDB\`, \`ARCHIVE\`, \`CSV\`, \`BLACKHOLE\`, \`MEMORY\`, \`MyISAM\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  DATABASE_COLUMN: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`id\`, \`createdAt\`, \`token\`, \`name\`, \`category\`, \`phone\`, \`group\`, \`comment\`, \`status\`, \`email\`, \`password\`, \`avatar\`, \`updatedAt\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  DATABASE_COLLATION: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`ascii_general_ci\`, \`ascii_bin\`, \`cp1250_bin\`, \`utf8_unicode_ci\`, \`cp1250_general_ci\`, \`utf8_general_ci\`, \`utf8_bin\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMPANY_SUFFIXES: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Inc\`,\`and Sons\`, \`LLC\`, \`Group\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMPANY_NAME: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Grady LLC\`, \`Friesen LLC\`, \`Cummerata Inc\`, \`Smith, Price and Bernhard\`, \`Nolan Group\`, \`Walter, Schimmel and Windler\`, \`Greenholt, Green and Luettgen\`, \`Watsica - Keeling\`, \`King, Brown and Blick\`, \`Lind, Stracke and Casper\`, \`Lemke, Conn and Harvey\`, \`Block, Toy and Russel\`, \`Cronin Group\`, \`Hettinger Inc\`, \`Halvorson, Gulgowski and Kautzer\`, \`Brown, Schimmel and Johns\`, \`Windler and Sons\`, \`Goodwin, Ryan and Pagac\`, \`Hills and Sons\`, \`Sanford - Schmeler\`, \`Tillman Group\`, \`Dibbert Inc\`, \`Metz, Yost and Torp\`, \`Franecki, Gerhold and Schmitt\`, \`Cronin, Schulist and Crist\`, \`Ferry LLC\`, \`Harris Group\`, \`Hilpert - Macejkovic\`, \`Okuneva LLC\`, \`Reilly - Cronin\`, \`Hammes, Bosco and Beahan\`, \`Sawayn Inc\`, \`Berge LLC\`, \`Gibson - Ryan\`, \`Reinger, Oberbrunner and Ortiz\`, \`Bashirian - Grady\`, \`Mayer Group\`, \`Wintheiser LLC\`, \`Zemlak Group\`, \`D'Amore, Sporer and Waelchi\`, \`Durgan and Sons\`, \`Schulist, Grady and Emmerich\`, \`Rohan and Sons\`, \`Reynolds and Sons\`, \`Langworth - Erdman\`, \`Swift, Hickle and Feil\`, \`Davis - Kertzmann\`, \`Glover LLC\`, \`Koelpin LLC\`, \`Ankunding - Rolfson\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMPANY_CATCH_PHRASE_NOUN: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`budgetary management\`, \`website\`, \`benchmark\`, \`strategy\`, \`concept\`, \`methodology\`, \`solution\`, \`model\`, \`flexibility\`, \`time-frame\`, \`implementation\`, \`portal\`, \`frame\`, \`interface\`, \`collaboration\`, \`monitoring\`, \`leverage\`, \`adapter\`, \`projection\`, \`installation\`, \`product\`, \`knowledge base\`, \`array\`, \`help-desk\`, \`Graphic Interface\`, \`workforce\`, \`framework\`, \`architecture\`, \`matrix\`, \`policy\`, \`hub\`, \`contingency\`, \`info-mediaries\`, \`function\`, \`capability\`, \`forecast\`, \`firmware\`, \`hierarchy\`, \`archive\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMPANY_CATCH_PHRASE_DESCRIPTOR: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`discrete\`, \`even-keeled\`, \`well-modulated\`, \`zero tolerance\`, \`context-sensitive\`, \`eco-centric\`, \`systemic\`, \`object-oriented\`, \`optimal\`, \`web-enabled\`, \`uniform\`, \`reciprocal\`, \`transitional\`, \`heuristic\`, \`value-added\`, \`stable\`, \`empowering\`, \`demand-driven\`, \`coherent\`, \`interactive\`, \`fault-tolerant\`, \`multi-tasking\`, \`full-range\`, \`optimizing\`, \`dynamic\`, \`high-level\`, \`zero administration\`, \`grid-enabled\`, \`static\`, \`multi-state\`, \`tangible\`, \`exuding\`, \`radical\`, \`upward-trending\`, \`solution-oriented\`, \`user-facing\`, \`content-based\`, \`zero defect\`, \`motivating\`, \`regional\`, \`foreground\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMPANY_CATCH_PHRASE_ADJECTIVE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`User-centric\`, \`Reactive\`, \`Programmable\`, \`Synergized\`, \`Total\`, \`Organic\`, \`Reduced\`, \`Synergistic\`, \`Configurable\`, \`De-engineered\`, \`Down-sized\`, \`Digitized\`, \`Open-source\`, \`Public-key\`, \`Progressive\`, \`Upgradable\`, \`Secured\`, \`Ergonomic\`, \`Customer-focused\`, \`Re-engineered\`, \`Persevering\`, \`Reverse-engineered\`, \`Devolved\`, \`Profit-focused\`, \`Future-proofed\`, \`Customizable\`, \`Assimilated\`, \`Streamlined\`, \`Right-sized\`, \`Function-based\`, \`Cross-group\`, \`User-friendly\`, \`Managed\`, \`Implemented\`, \`Self-enabling\`, \`Fully-configurable\`, \`Organized\`, \`Expanded\`, \`Versatile\`, \`Exclusive\`, \`Monitored\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMPANY_CATCH_PHRASE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Profound 24/7 methodology\`, \`Multi-channelled zero tolerance process improvement\`, \`Seamless executive benchmark\`, \`Enterprise-wide hybrid challenge\`, \`Seamless non-volatile project\`, \`Stand-alone multi-tasking pricing structure\`, \`Synchronised methodical hardware\`, \`De-engineered dynamic conglomeration\`, \`Grass-roots local project\`, \`Virtual well-modulated orchestration\`, \`User-friendly bottom-line groupware\`, \`Progressive neutral Graphical User Interface\`, \`Open-source optimal function\`, \`Configurable object-oriented structure\`, \`Pre-emptive even-keeled policy\`, \`Organized bandwidth-monitored structure\`, \`Realigned bi-directional paradigm\`, \`Decentralized composite info-mediaries\`, \`Virtual system-worthy challenge\`, \`Proactive global complexity\`, \`Enterprise-wide coherent implementation\`, \`Universal leading edge instruction set\`, \`Stand-alone exuding collaboration\`, \`Reduced homogeneous flexibility\`, \`Upgradable zero defect Graphical User Interface\`, \`Multi-channelled global methodology\`, \`Triple-buffered neutral challenge\`, \`Assimilated static throughput\`, \`Down-sized radical hub\`, \`Customer-focused hybrid website\`, \`Automated mission-critical collaboration\`, \`Reactive systematic concept\`, \`Organized intermediate model\`, \`Ergonomic impactful core\`, \`Operative zero defect knowledge base\`, \`Universal tangible throughput\`, \`Expanded incremental intranet\`, \`Enhanced bifurcated time-frame\`, \`Secured background flexibility\`, \`Adaptive needs-based website\`, \`Multi-layered client-server functionalities\`, \`De-engineered user-facing model\`, \`Innovative national budgetary management\`, \`Intuitive system-worthy hub\`, \`Programmable 3rd generation budgetary management\`, \`Synchronised reciprocal open system\`, \`Reactive local analyzer\`, \`Programmable 24/7 initiative\`, \`Multi-lateral bandwidth-monitored internet solution\`, \`Synergized homogeneous process improvement\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMPANY_BUZZ_VERB: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`envisioneer\`, \`streamline\`, \`revolutionize\`, \`e-enable\`, \`whiteboard\`, \`orchestrate\`, \`incentivize\`, \`harness\`, \`redefine\`, \`visualize\`, \`exploit\`, \`reinvent\`, \`matrix\`, \`utilize\`, \`extend\`, \`unleash\`, \`facilitate\`, \`empower\`, \`transform\`, \`deploy\`, \`engage\`, \`deliver\`, \`implement\`, \`synergize\`, \`aggregate\`, \`embrace\`, \`incubate\`, \`benchmark\`, \`enable\`, \`monetize\`, \`synthesize\`, \`scale\`, \`integrate\`, \`maximize\`, \`recontextualize\`, \`target\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMPANY_BUZZ_PHRASE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`streamline synergistic architectures\`, \`transition B2B web services\`, \`matrix cross-media methodologies\`, \`incentivize dot-com methodologies\`, \`scale clicks-and-mortar e-markets\`, \`e-enable dynamic deliverables\`, \`iterate frictionless paradigms\`, \`innovate vertical experiences\`, \`target bleeding-edge eyeballs\`, \`e-enable efficient deliverables\`, \`productize compelling blockchains\`, \`architect cutting-edge content\`, \`synthesize proactive synergies\`, \`grow frictionless metrics\`, \`unleash sticky models\`, \`embrace scalable functionalities\`, \`facilitate holistic bandwidth\`, \`cultivate e-business platforms\`, \`expedite killer web services\`, \`orchestrate ubiquitous mindshare\`, \`e-enable bricks-and-clicks networks\`, \`iterate mission-critical portals\`, \`redefine vertical blockchains\`, \`leverage revolutionary solutions\`, \`drive revolutionary e-markets\`, \`embrace real-time technologies\`, \`matrix transparent paradigms\`, \`utilize plug-and-play initiatives\`, \`engage world-class bandwidth\`, \`embrace viral infrastructures\`, \`embrace holistic bandwidth\`, \`enable leading-edge experiences\`, \`implement interactive action-items\`, \`maximize virtual communities\`, \`strategize one-to-one functionalities\`, \`facilitate dot-com channels\`, \`enhance frictionless synergies\`, \`evolve distributed e-commerce\`, \`empower seamless networks\`, \`generate sticky blockchains\`, \`deploy enterprise channels\`, \`mesh global experiences\`, \`redefine one-to-one solutions\`, \`innovate compelling communities\`, \`grow e-business e-business\`, \`orchestrate efficient initiatives\`, \`streamline cross-platform markets\`, \`extend out-of-the-box technologies\`, \`target leading-edge bandwidth\`, \`matrix global lifetime value\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMPANY_BUZZ_NOUN: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`functionalities\`, \`blockchains\`, \`e-markets\`, \`methodologies\`, \`models\`, \`metrics\`, \`synergies\`, \`mindshare\`, \`relationships\`, \`web services\`, \`partnerships\`, \`lifetime value\`, \`ROI\`, \`niches\`, \`schemas\`, \`infrastructures\`, \`communities\`, \`convergence\`, \`markets\`, \`networks\`, \`action-items\`, \`applications\`, \`users\`, \`solutions\`, \`channels\`, \`eyeballs\`, \`supply-chains\`, \`portals\`, \`architectures\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMPANY_BUZZ_ADJECTIVE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`frictionless\`, \`mission-critical\`, \`24/7\`, \`web-enabled\`, \`robust\`, \`cutting-edge\`, \`world-class\`, \`compelling\`, \`back-end\`, \`distributed\`, \`impactful\`, \`next-generation\`, \`wireless\`, \`integrated\`, \`proactive\`, \`global\`, \`dynamic\`, \`visionary\`, \`user-centric\`, \`sticky\`, \`real-time\`, \`synergistic\`, \`cross-platform\`, \`B2B\`, \`magnetic\`, \`B2C\`, \`cross-media\`, \`dot-com\`, \`efficient\`, \`one-to-one\`, \`front-end\`, \`turn-key\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMPANY_BS_NOUN: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`schemas\`, \`networks\`, \`blockchains\`, \`convergence\`, \`systems\`, \`metrics\`, \`deliverables\`, \`paradigms\`, \`models\`, \`synergies\`, \`relationships\`, \`functionalities\`, \`content\`, \`experiences\`, \`bandwidth\`, \`technologies\`, \`eyeballs\`, \`architectures\`, \`solutions\`, \`methodologies\`, \`web services\`, \`lifetime value\`, \`e-commerce\`, \`applications\`, \`portals\`, \`niches\`, \`markets\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMPANY_BS_BUZZ: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`productize\`, \`repurpose\`, \`architect\`, \`deploy\`, \`seize\`, \`unleash\`, \`enable\`, \`iterate\`, \`leverage\`, \`incubate\`, \`generate\`, \`revolutionize\`, \`evolve\`, \`syndicate\`, \`disintermediate\`, \`implement\`, \`cultivate\`, \`synthesize\`, \`transition\`, \`visualize\`, \`benchmark\`, \`utilize\`, \`maximize\`, \`reinvent\`, \`deliver\`, \`transform\`, \`target\`, \`streamline\`, \`envisioneer\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMPANY_BS_ADJECTIVE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`one-to-one\`, \`scalable\`, \`ubiquitous\`, \`frictionless\`, \`web-enabled\`, \`rich\`, \`sticky\`, \`end-to-end\`, \`granular\`, \`proactive\`, \`seamless\`, \`visionary\`, \`cross-platform\`, \`killer\`, \`transparent\`, \`B2B\`, \`24/7\`, \`mission-critical\`, \`value-added\`, \`wireless\`, \`clicks-and-mortar\`, \`collaborative\`, \`compelling\`, \`B2C\`, \`world-class\`, \`holistic\`, \`cross-media\`, \`leading-edge\`, \`bleeding-edge\`, \`innovative\`, \`front-end\`, \`virtual\`, \`enterprise\`, \`interactive\`, \`sexy\`, \`global\`, \`best-of-breed\`, \`magnetic\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMPANY_BS: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`mesh user-centric supply-chains\`, \`empower plug-and-play portals\`, \`implement B2C ROI\`, \`synthesize out-of-the-box networks\`, \`mesh revolutionary content\`, \`implement bleeding-edge action-items\`, \`streamline granular blockchains\`, \`engineer out-of-the-box lifetime value\`, \`recontextualize efficient interfaces\`, \`implement bricks-and-clicks niches\`, \`exploit killer initiatives\`, \`synergize scalable synergies\`, \`drive integrated e-markets\`, \`deploy viral lifetime value\`, \`recontextualize cutting-edge bandwidth\`, \`exploit revolutionary e-business\`, \`embrace robust users\`, \`implement out-of-the-box initiatives\`, \`extend proactive experiences\`, \`implement virtual communities\`, \`reintermediate virtual functionalities\`, \`aggregate front-end initiatives\`, \`seize one-to-one relationships\`, \`generate 24/365 interfaces\`, \`facilitate B2C networks\`, \`repurpose mission-critical niches\`, \`exploit integrated platforms\`, \`engineer viral bandwidth\`, \`architect sticky portals\`, \`maximize efficient platforms\`, \`incubate extensible bandwidth\`, \`reinvent sticky markets\`, \`synergize seamless interfaces\`, \`incentivize wireless networks\`, \`drive dynamic networks\`, \`deploy rich ROI\`, \`reintermediate front-end bandwidth\`, \`reinvent compelling solutions\`, \`architect granular methodologies\`, \`innovate revolutionary applications\`, \`reintermediate B2B supply-chains\`, \`deploy strategic users\`, \`brand sticky ROI\`, \`strategize bleeding-edge e-business\`, \`monetize B2C markets\`, \`synthesize revolutionary web services\`, \`transition user-centric networks\`, \`mesh real-time web services\`, \`drive 24/365 relationships\`, \`facilitate value-added initiatives\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMMERCE_PRODUCT_NAME: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Ergonomic Fresh Hat\`, \`Ergonomic Plastic Pizza\`, \`Modern Bronze Salad\`, \`Modern Metal Computer\`, \`Unbranded Frozen Bacon\`, \`Elegant Steel Mouse\`, \`Generic Plastic Chips\`, \`Gorgeous Fresh Pants\`, \`Handcrafted Steel Fish\`, \`Sleek Granite Chips\`, \`Licensed Soft Pizza\`, \`Intelligent Cotton Soap\`, \`Ergonomic Bronze Chips\`, \`Tasty Wooden Table\`, \`Generic Concrete Mouse\`, \`Ergonomic Concrete Ball\`, \`Oriental Soft Salad\`, \`Oriental Plastic Bike\`, \`Bespoke Cotton Ball\`, \`Incredible Rubber Car\`, \`Oriental Steel Bike\`, \`Electronic Plastic Shoes\`, \`Recycled Concrete Chair\`, \`Handmade Frozen Pizza\`, \`Awesome Plastic Bacon\`, \`Intelligent Plastic Mouse\`, \`Unbranded Steel Salad\`, \`Elegant Plastic Pizza\`, \`Unbranded Concrete Shirt\`, \`Unbranded Cotton Tuna\`, \`Fantastic Cotton Car\`, \`Rustic Rubber Sausages\`, \`Handmade Rubber Fish\`, \`Oriental Metal Computer\`, \`Generic Concrete Table\`, \`Handmade Wooden Cheese\`, \`Recycled Metal Salad\`, \`Fantastic Bronze Computer\`, \`Small Steel Soap\`, \`Licensed Frozen Chicken\`, \`Unbranded Plastic Ball\`, \`Licensed Bronze Sausages\`, \`Practical Concrete Gloves\`, \`Ergonomic Granite Bacon\`, \`Practical Concrete Chips\`, \`Unbranded Plastic Fish\`, \`Elegant Granite Tuna\`, \`Gorgeous Rubber Cheese\`, \`Fantastic Plastic Salad\`, \`Awesome Wooden Car\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMMERCE_PRODUCT_MATERIAL: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Wooden\`, \`Steel\`, \`Bronze\`, \`Concrete\`, \`Metal\`, \`Plastic\`, \`Granite\`, \`Frozen\`, \`Cotton\`, \`Fresh\`, \`Rubber\`, \`Soft\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMMERCE_PRODUCT_DESCRIPTION: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`The Apollotech B340 is an affordable wireless mouse with reliable connectivity, 12 months battery life and modern design\`, \`The beautiful range of Apple Naturalé that has an exciting mix of natural ingredients. With the Goodness of 100% Natural Ingredients\`, \`The Nagasaki Lander is the trademarked name of several series of Nagasaki sport bikes, that started with the 1984 ABC800J\`, \`Carbonite web goalkeeper gloves are ergonomically designed to give easy fit\`, \`Andy shoes are designed to keeping in mind durability as well as trends, the most stylish range of shoes & sandals\`, \`The Football Is Good For Training And Recreational Purposes\`, \`Boston's most advanced compression wear technology increases muscle oxygenation, stabilizes active muscles\`, \`The slim & simple Maple Gaming Keyboard from Dev Byte comes with a sleek body and 7- Color RGB LED Back-lighting for smart functionality\`, \`Ergonomic executive chair upholstered in bonded black leather and PVC padded seat and back for all-day comfort and support\`, \`The automobile layout consists of a front-engine design, with transaxle-type transmissions mounted at the rear of the engine and four wheel drive\`, \`New ABC 13 9370, 13.3, 5th Gen CoreA5-8250U, 8GB RAM, 256GB SSD, power UHD Graphics, OS 10 Home, OS Office A & J 2016\`, \`New range of formal shirts are designed keeping you in mind. With fits and styling that will make you stand apart\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMMERCE_PRODUCT: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Shoes\`, \`Car\`, \`Keyboard\`, \`Soap\`, \`Salad\`, \`Cheese\`, \`Bacon\`, \`Chips\`, \`Table\`, \`Towels\`, \`Sausages\`, \`Hat\`, \`Tuna\`, \`Chair\`, \`Ball\`, \`Fish\`, \`Mouse\`, \`Chicken\`, \`Pants\`, \`Computer\`, \`Bike\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMMERCE_ISBN: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`978-1-7011-7164-0\`, \`978-0-19-791260-7\`, \`978-1-81528-761-9\`, \`978-1-260-18780-9\`, \`978-0-9878525-1-9\`, \`978-1-6520-4956-2\`, \`978-1-100-95840-8\`, \`978-1-5298-4698-0\`, \`978-1-990758-28-7\`, \`978-0-07-406771-0\`, \`978-1-324-68828-0\`, \`978-0-351-77640-3\`, \`978-0-367-15117-1\`, \`978-0-7854-0059-2\`, \`978-0-491-76632-6\`, \`978-0-657-91411-0\`, \`978-0-405-52168-3\`, \`978-0-9716701-2-9\`, \`978-0-663-33501-5\`, \`978-1-7225-6789-7\`, \`978-0-909509-67-5\`, \`978-1-06-615934-5\`, \`978-0-210-31997-0\`, \`978-1-62680-669-6\`, \`978-0-523-22196-0\`, \`978-0-337-41780-1\`, \`978-0-86277-846-0\`, \`978-0-422-79175-5\`, \`978-1-01-848362-7\`, \`978-1-63702-688-5\`, \`978-1-329-25597-5\`, \`978-1-009-88338-2\`, \`978-0-7633-1420-0\`, \`978-0-355-79648-3\`, \`978-0-9506971-1-6\`, \`978-0-17-976336-4\`, \`978-0-651-63260-7\`, \`978-1-4143-8059-9\`, \`978-0-01-239199-0\`, \`978-0-7057-5532-0\`, \`978-0-628-61896-2\`, \`978-1-4567-8014-2\`, \`978-0-7429-5031-3\`, \`978-1-300-86118-8\`, \`978-1-366-04301-6\`, \`978-0-243-50283-7\`, \`978-1-184-97164-5\`, \`978-1-6925-4892-6\`, \`978-1-878629-72-2\`, \`978-1-5494-0838-0\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COMMERCE_DEPARTMENT: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Clothing\`, \`Jewelery\`, \`Movies\`, \`Automotive\`, \`Books\`, \`Home\`, \`Shoes\`, \`Garden\`, \`Beauty\`, \`Computers\`, \`Electronics\`, \`Industrial\`, \`Music\`, \`Sports\`, \`Games\`, \`Baby\`, \`Tools\`, \`Kids\`, \`Grocery\`, \`Health\`, \`Toys\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COLOR_SPACE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`British Standard Colour (BS)\`, \`Rec. 709\`, \`HSL\`, \`Academy Color Encoding System (ACES)\`, \`Rec. 601\`, \`HSLuv\`, \`CMYK\`, \`Federal Standard 595C\`, \`Natural Color System (NSC)\`, \`sYCC\`, \`CMY\`, \`CIELUV\`, \`Uniform Color Spaces (UCSs)\`, \`ProPhoto RGB Color Space\`, \`HSLA\`, \`Display-P3\`, \`DCI-P3\`, \`scRGB\`, \`sRGB\`, \`RGK\`, \`Adobe Wide Gamut RGB\`, \`Munsell Color System\`, \`RG\`, \`Pantone Matching System (PMS)\`, \`CIEUVW\`, \`LMS\`, \`HKS\`, \`Rec. 2020\`, \`CIELAB\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COLOR_RGB: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`#1c484e\`, \`#6aeede\`, \`#fa8945\`, \`#a8de43\`, \`#0c2ced\`, \`#59dacd\`, \`#e9ca14\`, \`#b1badc\`, \`#fbedb7\`, \`#b2105d\`, \`#eba6ff\`, \`#d8a5ef\`, \`#ad1bc6\`, \`#00d19b\`, \`#f55ff1\`, \`#7c4fb2\`, \`#4b2b22\`, \`#fbfced\`, \`#0651dc\`, \`#a5f229\`, \`#9d279b\`, \`#707fe6\`, \`#ce04bd\`, \`#3854a0\`, \`#b519bb\`, \`#fe7b11\`, \`#2f1ab9\`, \`#1d4df8\`, \`#943bfe\`, \`#ebe8c2\`, \`#b57cf7\`, \`#9aca98\`, \`#cf17ca\`, \`#1a2afc\`, \`#6a1f72\`, \`#cf8cf5\`, \`#c9d98b\`, \`#fa779f\`, \`#7fbcef\`, \`#e7fe72\`, \`#eeb52f\`, \`#f5c2f9\`, \`#aa5f08\`, \`#0a063b\`, \`#97ce30\`, \`#a8affd\`, \`#32ebac\`, \`#5936bb\`, \`#f9bc7c\`, \`#21c766\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COLOR_LCH: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`0.919257,87.9,58.3\`, \`0.785338,110.6,228.9\`, \`0.191578,117.6,72.1\`, \`0.812447,199.6,60\`, \`0.164611,127.1,165\`, \`0.873573,215.4,182.5\`, \`0.494176,35,107.3\`, \`0.174418,179.4,145\`, \`0.975136,192.7,133.1\`, \`0.103291,138.2,11.3\`, \`0.436354,40.1,89.3\`, \`0.393374,162.3,191.9\`, \`0.523511,2.1,39.9\`, \`0.79022,96,99.5\`, \`0.492124,191.8,178\`, \`0.759787,86.9,171.9\`, \`0.640081,119.3,10.4\`, \`0.818826,3.5,99.5\`, \`0.718386,7.1,109.3\`, \`0.905125,218.5,23.5\`, \`0.872615,74.9,111.7\`, \`0.409633,77.4,153.8\`, \`0.770543,72.3,185.7\`, \`0.382539,60.2,186.4\`, \`0.387375,118.3,157.3\`, \`0.561256,98.9,15.3\`, \`0.81524,133.3,58.5\`, \`0.240435,38,132.7\`, \`0.429175,174.1,133\`, \`0.983829,80.5,123.9\`, \`0.662899,118.7,73.3\`, \`0.788321,60.2,194.5\`, \`0.732149,151.9,140.8\`, \`0.833773,217.4,84.2\`, \`0.188967,167,178\`, \`0.829393,5.3,193.6\`, \`0.766224,92.5,101.9\`, \`0.226052,40.2,39.3\`, \`0.925071,90.5,13.8\`, \`0.842816,120.8,182.6\`, \`0.084495,27.8,168.9\`, \`0.598301,45.7,40.5\`, \`0.020244,31.6,30\`, \`0.104832,61.3,169.7\`, \`0.356723,200.6,65.8\`, \`0.019738,140,163.4\`, \`0.388161,100,8.2\`, \`0.144321,86.8,140.6\`, \`0.426864,125.7,144.7\`, \`0.023651,176.7,168.2\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COLOR_LAB: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`0.057544,82.9771,93.4628\`, \`0.424118,33.3691,24.9062\`, \`0.907326,-63.6372,-60.4979\`, \`0.419842,71.091,-40.4079\`, \`0.161665,48.0405,85.4677\`, \`0.033632,57.6144,-60.4138\`, \`0.33898,16.587,-3.7023\`, \`0.206677,-84.8437,1.3262\`, \`0.856002,-75.2181,68.4043\`, \`0.891165,-93.2182,-45.1418\`, \`0.877718,39.6543,-0.5848\`, \`0.567257,-84.5565,79.919\`, \`0.764738,59.2829,-62.8679\`, \`0.978449,-8.3921,50.1786\`, \`0.129208,-98.0808,-9.6118\`, \`0.52064,-13.5604,9.4678\`, \`0.302817,43.5683,0.4207\`, \`0.878965,-21.8177,37.5044\`, \`0.966733,13.5293,15.9073\`, \`0.66677,-18.8186,-55.3268\`, \`0.519402,-65.2185,-50.0969\`, \`0.081999,27.7613,-11.6083\`, \`0.32084,43.6345,37.7497\`, \`0.992365,82.0524,4.0639\`, \`0.114484,-91.1557,0.3823\`, \`0.856549,-14.674,-28.4029\`, \`0.914118,-86.4204,-90.1492\`, \`0.114556,-58.5244,-85.2373\`, \`0.966787,61.8863,92.2686\`, \`0.264021,57.0309,31.1356\`, \`0.556941,-40.3479,15.6194\`, \`0.158769,79.0786,1.4238\`, \`0.774277,53.6931,-0.5945\`, \`0.269501,18.1818,1.8674\`, \`0.599499,98.8524,48.2731\`, \`0.377763,37.0874,-17.1119\`, \`0.105744,98.983,80.2509\`, \`0.492488,26.4253,-55.2358\`, \`0.54789,77.8445,53.401\`, \`0.866813,12.8753,-97.1004\`, \`0.937859,-99.733,25.3876\`, \`0.505785,-97.0701,39.3956\`, \`0.659704,51.054,-2.9166\`, \`0.117759,30.0235,-54.389\`, \`0.718825,65.4725,-72.4175\`, \`0.805048,49.2344,22.6841\`, \`0.313569,45.7854,16.4543\`, \`0.986695,-16.6309,97.2991\`, \`0.691846,-90.069,-99.0346\`, \`0.526011,81.0591,27.0726\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COLOR_HWB: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`38,0.34,0.78\`, \`285,0.55,0.16\`, \`34,0.52,0.73\`, \`22,0.27,0.28\`, \`357,0.72,0.57\`, \`270,0.31,0.78\`, \`29,0.6,0.73\`, \`195,0.42,0.22\`, \`323,0.02,0.75\`, \`63,0.56,0.12\`, \`332,0.91,0.54\`, \`52,0.8,0.69\`, \`314,0.52,0.88\`, \`43,0.71,0.16\`, \`195,0.87,0.93\`, \`200,0.15,0.34\`, \`108,0.26,0.94\`, \`205,0.07,0.82\`, \`314,0.04,0.57\`, \`258,0.27,0.22\`, \`300,0.33,0.21\`, \`239,0.64,0.56\`, \`280,0.88,0.66\`, \`195,0.71,0.94\`, \`126,0.77,0.56\`, \`9,0.23,0.94\`, \`341,0.37,0.13\`, \`172,0.23,0.73\`, \`276,0.34,0.62\`, \`83,0.42,0.42\`, \`29,0.19,0.57\`, \`45,0.46,0.76\`, \`60,0.88,0.69\`, \`322,0.7,0.21\`, \`50,0.58,0.24\`, \`284,0.47,0.15\`, \`145,0.89,0.64\`, \`83,0.03,0.11\`, \`72,0.86,0.87\`, \`154,0.81,0.23\`, \`179,0.4,0.61\`, \`354,0.61,0.6\`, \`331,0.25,0.61\`, \`288,0.07,0.25\`, \`38,0.85,0.21\`, \`190,0.34,0\`, \`355,0.81,0.4\`, \`356,0.1,0.43\`, \`35,0.95,0.36\`, \`293,0.66,0.96\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COLOR_HUMAN: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`mint green\`, \`ivory\`, \`purple\`, \`plum\`, \`turquoise\`, \`cyan\`, \`teal\`, \`salmon\`, \`lavender\`, \`gold\`, \`fuchsia\`, \`tan\`, \`magenta\`, \`sky blue\`, \`red\`, \`lime\`, \`azure\`, \`green\`, \`grey\`, \`black\`, \`maroon\`, \`yellow\`, \`white\`, \`orchid\`, \`indigo\`, \`olive\`, \`violet\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COLOR_HSL: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`136,0.53,0.31\`, \`161,0.04,0.08\`, \`12,0.15,0.64\`, \`338,0.56,0.85\`, \`300,0.52,0.05\`, \`127,0.92,0.52\`, \`49,0.21,0.3\`, \`193,0.44,0.79\`, \`96,0.39,0.7\`, \`86,0.97,0.14\`, \`285,0.03,0.44\`, \`107,0.86,0.64\`, \`250,0.56,0.58\`, \`283,0.44,0.73\`, \`32,0.46,0.14\`, \`37,0.91,0.67\`, \`137,0.47,0.47\`, \`19,0.28,0.39\`, \`212,0.69,0.3\`, \`324,0.79,0.46\`, \`263,0.64,0.39\`, \`117,0.06,0.2\`, \`291,0.39,0.53\`, \`198,0.05,0.28\`, \`254,0.64,0.2\`, \`348,0.94,0.86\`, \`96,0.03,0.81\`, \`72,0.35,0.43\`, \`347,0.09,0.31\`, \`275,0.9,0.94\`, \`180,0.4,0.35\`, \`259,0.89,0.47\`, \`351,0.98,0.19\`, \`349,0.54,0.12\`, \`122,0.69,0.35\`, \`272,0.21,0.96\`, \`318,0.09,0.63\`, \`360,0.51,0.02\`, \`172,0.23,0.54\`, \`17,0.06,0.15\`, \`115,0.52,0.15\`, \`219,0.64,0.38\`, \`180,0.33,0.86\`, \`126,0.13,0.28\`, \`94,0.94,0.56\`, \`247,0.89,0.62\`, \`183,0.22,0.92\`, \`229,0.59,0.82\`, \`69,0.59,0.11\`, \`78,0.51,0.21\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COLOR_CSS_SUPPORTED_SPACE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`display-p3\`, \`a98-rgb\`, \`prophoto-rgb\`, \`sRGB\`, \`rec2020\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COLOR_CSS_SUPPORTED_FUNCTION: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`lch\`, \`hsla\`, \`cmyk\`, \`lab\`, \`hsl\`, \`rgb\`, \`rgba\`, \`hwb\`, \`color\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COLOR_COLOR_BY_C_S_S_COLOR_SPACE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`0.6154,0.0728,0.398\`, \`0.4833,0.3161,0.5454\`, \`0.7599,0.1768,0.572\`, \`0.3665,0.9896,0.2019\`, \`0.3215,0.3675,0.7072\`, \`0.926,0.5532,0.1448\`, \`0.7234,0.559,0.5599\`, \`0.7386,0.5485,0.1518\`, \`0.2802,0.9633,0.0023\`, \`0.9414,0.4731,0.2771\`, \`0.1547,0.4659,0.1428\`, \`0.4067,0.1874,0.2332\`, \`0.5301,0.0441,0.2817\`, \`0.3635,0.5225,0.8955\`, \`0.8014,0.4501,0.3713\`, \`0.654,0.1401,0.543\`, \`0.7197,0.2346,0.9499\`, \`0.9611,0.2358,0.4202\`, \`0.9487,0.5137,0.3801\`, \`0.1943,0.4158,0.5718\`, \`0.7353,0.5343,0.1312\`, \`0.7085,0.8158,0.8528\`, \`0.3815,0.6252,0.6211\`, \`0.3631,0.0276,0.7801\`, \`0.4348,0.0822,0.3439\`, \`0.3461,0.1021,0.4503\`, \`0.1558,0.2519,0.4138\`, \`0.2968,0.3722,0.5521\`, \`0.1961,0.6981,0.4699\`, \`0.6924,0.0233,0.4586\`, \`0.6891,0.3722,0.6424\`, \`0.89,0.8353,0.3946\`, \`0.6053,0.6214,0.1388\`, \`0.3497,0.6714,0.0463\`, \`0.2322,0.3276,0.1954\`, \`0.1167,0.5652,0.4343\`, \`0.0649,0.7928,0.5867\`, \`0.9985,0.5964,0.8382\`, \`0.5417,0.702,0.6964\`, \`0.4299,0.4696,0.1341\`, \`0.301,0.2054,0.7632\`, \`0.2191,0.3903,0.1331\`, \`0.8827,0.6388,0.3973\`, \`0.906,0.2041,0.3563\`, \`0.9482,0.2627,0.798\`, \`0.2601,0.3027,0.0912\`, \`0.5987,0.7682,0.1666\`, \`0.2618,0.654,0.4638\`, \`0.9597,0.1975,0.9169\`, \`0.4204,0.0349,0.0646\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  COLOR_CMYK: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`0.22,0.84,0.57,0.46\`, \`0.67,0.88,0.33,0.75\`, \`0.83,0.82,0.66,0.74\`, \`0.95,0.09,0.98,0.62\`, \`0.05,0.23,0.49,0.78\`, \`0.28,0.99,0.04,0.24\`, \`0.13,0.15,0.41,0.99\`, \`0.22,0.86,0.14,0.85\`, \`0.45,0.84,0.22,0.07\`, \`0.03,0.87,0.5,0.8\`, \`0.7,0.47,0.67,0.47\`, \`0.77,0.49,0.89,0.28\`, \`0.2,0.41,0.72,0.56\`, \`0.69,0.98,0.89,0.93\`, \`0.82,0.17,0,0.18\`, \`0.79,0.48,0.54,0.55\`, \`0.31,0.29,0.13,0.79\`, \`0.04,0.67,0.11,0.02\`, \`0.15,0.26,0.39,0.46\`, \`0.51,0.65,0.44,0.8\`, \`0.72,0.88,0.43,0.33\`, \`0.95,0.37,0.49,0.98\`, \`0.87,0.47,0.25,0.99\`, \`0.44,0.11,0.28,0.1\`, \`0.62,0.24,0.39,0.64\`, \`0.42,0.21,0.85,0.16\`, \`0.15,0.22,0.8,0.71\`, \`0.38,0.68,0.79,0.86\`, \`0.53,0.5,0.89,0.85\`, \`0.88,0.92,0.81,0.72\`, \`0.71,0.95,0.47,0.43\`, \`0.3,0.34,0.41,0.74\`, \`0.25,0.56,0.29,0.21\`, \`0.12,0.12,0.47,0.69\`, \`0.45,0.22,0.43,0.43\`, \`0.47,0.05,0.11,0.39\`, \`0.24,0.49,0.01,0.24\`, \`0.76,0.52,0.84,0.96\`, \`0.81,0.27,0.76,0.17\`, \`0.57,0.39,0.01,0.31\`, \`0.16,0.18,0.49,0.67\`, \`0.85,0.74,0.08,0.67\`, \`0.27,0.63,0.65,0.9\`, \`0.83,0.43,0.16,0.73\`, \`0.71,0.51,0.4,0.98\`, \`0.79,0.94,0.35,0.11\`, \`0.26,0.71,0.15,0.29\`, \`0.66,0.16,0.72,0.71\`, \`0.23,0,0.62,0.56\`, \`0.25,0.67,0.39,0.07\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  ANIMAL_TYPE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`bear\`, \`cetacean\`, \`bird\`, \`lion\`, \`dog\`, \`crocodilia\`, \`horse\`, \`cat\`, \`rabbit\`, \`insect\`, \`snake\`, \`fish\`, \`cow\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  ANIMAL_SNAKE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Lyre snake\`, \`Eyelash pit viper\`, \`Shield-tailed snake\`, \`Chappell Island tiger snake\`, \`White-lipped python\`, \`Bornean pitviper\`, \`Madagascar tree boa\`, \`Grey-banded kingsnake\`, \`Mojave desert sidewinder\`, \`African puff adder\`, \`Vipera ammodytes\`, \`Down's tiger snake\`, \`Flat-nosed pitviper\`, \`Green palm viper\`, \`Reticulated python\`, \`Mangshan pitviper\`, \`Nitsche's bush viper\`, \`Stejneger's bamboo pitviper\`, \`Colorado desert sidewinder\`, \`Texas Coral Snake\`, \`Temple viper\`, \`Common cobra\`, \`Northern tree snake\`, \`High Woods coral snake\`, \`Cuban wood snake\`, \`Jamaican boa\`, \`Lesser black krait\`, \`Arizona black rattlesnake\`, \`Narrowhead Garter Snake\`, \`Rough-scaled bush viper\`, \`King brown\`, \`Southern Indonesian spitting cobra\`, \`Fer-de-lance\`, \`Moluccan flying snake\`, \`Mole viper\`, \`Green tree pit viper\`, \`Rough-scaled python\`, \`Dwarf beaked snake\`, \`Siamese palm viper\`, \`Blanding's tree snake\`, \`Philippine cobra\`, \`Japanese rat snake\`, \`Side-striped palm-pitviper\`, \`Burmese python\`, \`King Island tiger snake\`, \`Large shield snake\`, \`Yellow-banded sea snake\`, \`Sharp-nosed viper\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  ANIMAL_RODENT: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Salinoctomys\`, \`Streaked dwarf porcupine\`, \`Orinoco agouti\`, \`Black-tailed hairy dwarf porcupine\`, \`Salta tuco-tuco\`, \`Budin's chinchilla rat, A. budini\`, \`Fukomys anselli\`, \`Common degu\`, \`Brazilian porcupine\`, \`Steinbach's tuco-tuco\`, \`Lagidium\`, \`Furtive tuco-tuco\`, \`Cryptomys ochraceocinereus\`, \`Fukomys foxi\`, \`Cryptomys foxi\`, \`Octodontomys\`, \`Kannabateomys amblyonyx\`, \`Cryptomys damarensis\`, \`Octodon\`, \`Catamarca tuco-tuco\`, \`Bicolored-spined porcupine\`, \`Strong tuco-tuco\`, \`Octomys\`, \`Asiatic brush-tailed porcupine\`, \`Ashy chinchilla rat\`, \`Cuscomys ashanika\`, \`Fukomys\`, \`Dasyprocta\`, \`Olallamys albicauda\`, \`Heliophobius argenteocinereus\`, \`Social tuco-tuco\`, \`Dactylomys\`, \`Coruro\`, \`Porteous' tuco-tuco\`, \`Pearson's tuco-tuco\`, \`Red-rumped agouti\`, \`San Luis tuco-tuco\`, \`Plains viscacha-rat\`, \`Tympanoctomys\`, \`Crested agouti\`, \`Olallamys\`, \`Plains viscacha\`, \`Uspallata chinchilla rat\`, \`Black-rumped agouti\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  ANIMAL_RABBIT: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Silver Fox\`, \`New Zealand\`, \`Crème D’Argent\`, \`Dwarf Hotot\`, \`Mini Satin\`, \`French Lop\`, \`English Lop\`, \`Giant Chinchilla\`, \`Belgian Hare\`, \`American Chinchilla\`, \`Rhinelander\`, \`English Spot\`, \`French Angora\`, \`Palomino\`, \`Tan\`, \`Polish\`, \`Californian\`, \`Silver Marten\`, \`Rex\`, \`Lionhead\`, \`Argente Brun\`, \`Standard Chinchilla\`, \`Checkered Giant\`, \`Florida White\`, \`Holland Lop\`, \`English Angora\`, \`Dutch\`, \`Satin\`, \`Lilac\`, \`Mini Lop\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  ANIMAL_LION: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`West African Lion\`, \`Barbary Lion\`, \`Masai Lion\`, \`Asiatic Lion\`, \`Transvaal lion\`, \`Northeast Congo Lion\`, \`Cape lion\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  ANIMAL_INSECT: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`European hornet\`, \`Black and yellow mud dauber\`, \`Tiphiid wasp\`, \`Yellow and black potter wasp\`, \`Pavement ant\`, \`Braconid wasp\`, \`White-horned horntail\`, \`Red harvester ant\`, \`Cynipid gall wasp\`, \`Leafcutting bee\`, \`Red imported fire ant\`, \`Acacia-ants\`, \`Sweat bee\`, \`Weevil parasitoid\`, \`Oak saucer gall\`, \`Keyhole wasp\`, \`Scale parasitoid\`, \`Erythrina gall wasp\`, \`Little yellow ant\`, \`Sirex woodwasp\`, \`Gouty oak gall\`, \`Large oak-apple gall\`, \`False honey ant\`, \`Acorn-plum gall\`, \`Ichneumonid wasp\`, \`Little fire ant\`, \`Velvet ant\`, \`Golden northern bumble bee\`, \`Great black wasp\`, \`Tramp ant\`, \`Red wasp\`, \`Cuckoo wasp\`, \`Mossyrose gall wasp\`, \`Red-tailed wasp\`, \`Smaller yellow ant\`, \`Almond stone wasp\`, \`Carpenter wasp\`, \`Horned oak gall\`, \`Reddish carpenter ant\`, \`Macao paper wasp\`, \`Baldfaced hornet\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  ANIMAL_HORSE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Dutch Warmblood\`, \`Aegidienberger\`, \`Tori Horse\`, \`Dole Gudbrandsdal\`, \`Bardigiano\`, \`Sorraia\`, \`Heihe Horse\`, \`Brazilian Sport Horse\`, \`Mallorquín\`, \`Criollo Horse\`, \`Belgian Horse\`, \`Basque Mountain Horse\`, \`American Cream Draft\`, \`French Trotter\`, \`Moyle Horse\`, \`Nangchen Horse\`, \`Spanish Tarpan\`, \`Burmese Horse\`, \`Karabair\`, \`Tsushima\`, \`American Paint Horse\`, \`Australian Draught Horse\`, \`Chilean Corralero\`, \`Xilingol Horse\`, \`Budyonny Horse\`, \`Karabakh Horse\`, \`Spanish-Norman Horse\`, \`Henson Horse\`, \`Finnhorse\`, \`Calabrese Horse\`, \`Bashkir Curly\`, \`Kustanair\`, \`Falabella\`, \`Purosangue Orientale\`, \`Auxois\`, \`Nokota Horse\`, \`Dutch Heavy Draft\`, \`Swedish coldblood trotter\`, \`Rocky Mountain Horse\`, \`Baluchi Horse\`, \`Pintabian\`, \`Boulonnais Horse\`, \`Brandenburger\`, \`Kiger Mustang\`, \`Banker Horse\`, \`Przewalski's Horse\`, \`Anglo-Kabarda\`, \`Menorquín\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  ANIMAL_FISH: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Yellow croaker\`, \`Pond loach\`, \`Atlantic cod\`, \`Alaska pollock\`, \`Round sardinella\`, \`Daggertooth pike conger\`, \`Japanese common catfish\`, \`European sprat\`, \`Chum salmon\`, \`Mrigal carp\`, \`Bigeye tuna\`, \`Asian swamp eel\`, \`Southern rough shrimp\`, \`Atlantic menhaden\`, \`Short mackerel\`, \`Silver carp\`, \`Japanese cockle\`, \`Yellowfin tuna\`, \`Crucian carp\`, \`Pacific thread herring\`, \`Cape horse mackerel\`, \`Skipjack tuna\`, \`Channel catfish\`, \`Chub mackerel\`, \`Common carp\`, \`Bonga shad\`, \`Argentine hake\`, \`Rainbow trout\`, \`Largehead hairtail\`, \`Wuchang bream\`, \`Pollock\`, \`Pink salmon\`, \`Bombay-duck\`, \`Chilean jack mackerel\`, \`Korean bullhead\`, \`Grass carp\`, \`Atlantic salmon\`, \`Pacific herring\`, \`Hilsa shad\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  ANIMAL_DOG: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Pumi\`, \`Standard Schnauzer\`, \`Cantabrian Water Dog\`, \`Bichon Frisé\`, \`Stabyhoun\`, \`Grand Anglo-Français Blanc et Noir\`, \`Pomeranian\`, \`Chien Français Blanc et Noir\`, \`Swedish Lapphund\`, \`Ariegeois\`, \`Pastore della Lessinia e del Lagorai\`, \`Tenterfield Terrier\`, \`German Spaniel\`, \`Poitevin\`, \`Pont-Audemer Spaniel\`, \`Gordon Setter\`, \`Bulldog\`, \`Perro de Presa Canario\`, \`Entlebucher Mountain Dog\`, \`Akbash\`, \`Molossus of Epirus\`, \`Spanish Mastiff\`, \`Pekingese\`, \`Schipperke\`, \`Chien Français Tricolore\`, \`Volpino Italiano\`, \`Chien Français Blanc et Orange\`, \`Carea Castellano Manchego\`, \`Glen of Imaal Terrier\`, \`Soft-Coated Wheaten Terrier\`, \`Styrian Coarse-haired Hound\`, \`Yakutian Laika\`, \`Schweizerischer Niederlaufhund\`, \`Hokkaido\`, \`Australian Cattle Dog\`, \`Cirneco dell'Etna\`, \`Polish Tatra Sheepdog\`, \`French Bulldog\`, \`Golden Retriever\`, \`Thai Ridgeback\`, \`Seppala Siberian Sleddog\`, \`Grand Anglo-Français Blanc et Orange\`, \`Saint Hubert Jura Hound\`, \`Montenegrin Mountain Hound\`, \`Croatian Sheepdog\`, \`Trigg Hound\`, \`Brittany\`, \`Dogo Sardesco\`, \`English Mastiff\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  ANIMAL_CROCODILIA: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Dwarf Crocodile\`, \`New Guinea Freshwater Crocodile\`, \`Black Caiman\`, \`Schneider’s Smooth-fronted Caiman\`, \`Broad-snouted Caiman\`, \`Nile Crocodile\`, \`Cuvier’s Dwarf Caiman\`, \`Australian Freshwater Crocodile\`, \`Gharial\`, \`Orinoco Crocodile\`, \`Siamese Crocodile\`, \`Chinese Alligator\`, \`Mugger Crocodile\`, \`Cuban Crocodile\`, \`Spectacled Caiman\`, \`Alligator mississippiensis\`, \`West African Crocodile\`, \`African Slender-snouted Crocodile\`, \`Saltwater Crocodile\`, \`Tomistoma\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  ANIMAL_COW: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Holstein Friesian cattle\`, \`Red Fulani\`, \`Swedish Friesian\`, \`Lohani cattle\`, \`Belgian White-and-Red\`, \`Deep Red cattle\`, \`Iedit\`, \`Blanco Orejinegro BON\`, \`Khillari cattle\`, \`Gascon cattle\`, \`Monchina\`, \`Maronesa\`, \`Kenana cattle\`, \`Tharparkar\`, \`Huáng Cattle\`, \`Amsterdam Island cattle\`, \`Sussex\`, \`Sanhe\`, \`Australian Brangus\`, \`Blue Albion\`, \`Sanga\`, \`Argentine Criollo\`, \`Polled Hereford\`, \`Vestland Red Polled\`, \`American Brown Swiss\`, \`Limia cattle\`, \`Dutch Belted\`, \`Mocăniţă\`, \`Podolac\`, \`Romanian Steppe Gray\`, \`Black Angus\`, \`Wedit\`, \`Korat Wagyu\`, \`Muturu\`, \`Barzona\`, \`Costeño con Cuernos\`, \`Gloucester\`, \`Thai Black\`, \`Pinzgauer\`, \`Greyman cattle\`, \`Africangus\`, \`Avétonou\`, \`Austrian Yellow\`, \`Cedit\`, \`RX3\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  ANIMAL_CETACEAN: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Australian humpback Dolphin\`, \`Sei Whale\`, \`La Plata Dolphin\`, \`Long-Beaked Common Dolphin\`, \`Pacific White-Sided Dolphin\`, \`Commerson’s Dolphin\`, \`Southern Rightwhale Dolphin\`, \`Atlantic Humpbacked Dolphin\`, \`Indo-Pacific Bottlenose Dolphin\`, \`Indo-Pacific Hump-backed Dolphin\`, \`Chilean Dolphin\`, \`False Killer Whale\`, \`Amazon River Dolphin\`, \`Hector’s Dolphin\`, \`Blue Whale\`, \`Heaviside’s Dolphin\`, \`Burrunan Dolphin\`, \`Atlantic White-Sided Dolphin\`, \`Fin Whale\`, \`Hourglass Dolphin\`, \`Rough-Toothed Dolphin\`, \`Sperm Whale\`, \`White-Beaked Dolphin\`, \`Melon-headed Whale\`, \`Longman's Beaked Whale\`, \`Short-Beaked Common Dolphin\`, \`Southern Bottlenose Whale\`, \`Peale’s Dolphin\`, \`Costero\`, \`Killer Whale (Orca)\`, \`Bottlenose Dolphin\`, \`Risso’s Dolphin\`, \`Long-finned Pilot Whale\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  ANIMAL_CAT: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Egyptian Mau\`, \`Peterbald\`, \`British Shorthair\`, \`Exotic Shorthair\`, \`Maine Coon\`, \`Nebelung\`, \`Scottish Fold\`, \`Selkirk Rex\`, \`LaPerm\`, \`Singapura\`, \`Oriental\`, \`Minskin\`, \`Bombay\`, \`Tonkinese\`, \`Himalayan\`, \`Chausie\`, \`Ojos Azules\`, \`Highlander\`, \`Sokoke\`, \`Ocicat\`, \`Balinese\`, \`Burmese\`, \`Korat\`, \`American Shorthair\`, \`Persian\`, \`Pixiebob\`, \`Abyssinian\`, \`Sphynx\`, \`American Curl\`, \`Havana\`, \`Siberian\`, \`Birman\`, \`Thai\`, \`Savannah\`, \`Donskoy\`, \`Kurilian Bobtail\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  ANIMAL_BIRD: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Barn Owl\`, \`Cassin's Sparrow\`, \`Bay-breasted Warbler\`, \`Streak-backed Oriole\`, \`Thick-billed Parrot\`, \`Dickcissel\`, \`Whooping Crane\`, \`Eyebrowed Thrush\`, \`Smooth-billed Ani\`, \`Lesser Goldfinch\`, \`Hook-billed Kite\`, \`Northern Parula\`, \`Colima Warbler\`, \`Brown Booby\`, \`Painted Redstart\`, \`Orchard Oriole\`, \`Bendire's Thrasher\`, \`Nutting's Flycatcher\`, \`Tennessee Warbler\`, \`Sage Thrasher\`, \`Gila Woodpecker\`, \`Mottled Petrel\`, \`Greater Prairie-chicken\`, \`Mallard\`, \`Yellow-throated Warbler\`, \`Sky Lark\`, \`King Eider\`, \`Siberian Accentor\`, \`Lucy's Warbler\`, \`Five-striped Sparrow\`, \`Mexican Chickadee\`, \`Phainopepla\`, \`Ruddy Ground-Dove\`, \`Chestnut-backed Chickadee\`, \`Pin-tailed Snipe\`, \`White-crowned Pigeon\`, \`Common Rosefinch\`, \`Evening Grosbeak\`, \`Tropical Parula\`, \`Oriental Cuckoo\`, \`Nelson's Sharp-tailed Sparrow\`, \`Bonaparte's Gull\`, \`Eastern Bluebird\`, \`Bean Goose\`, \`Gray Silky-flycatcher\`, \`American Robin\`, \`Brandt's Cormorant\`, \`Glaucous-winged Gull\`, \`Pine Warbler\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  ANIMAL_BEAR: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`Giant panda\`, \`Asian black bear\`, \`Polar bear\`, \`Sun bear\`, \`Spectacled bear\`, \`Brown bear\`, \`Sloth bear\`, \`American black bear\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  AIRLINE_SEAT: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`21D\`, \`30B\`, \`5B\`, \`3D\`, \`7D\`, \`16A\`, \`34E\`, \`34C\`, \`29C\`, \`8A\`, \`30C\`, \`21A\`, \`11B\`, \`14A\`, \`15A\`, \`32C\`, \`12F\`, \`31B\`, \`18D\`, \`4E\`, \`25A\`, \`22C\`, \`32D\`, \`26F\`, \`28F\`, \`16C\`, \`28D\`, \`26B\`, \`31C\`, \`34B\`, \`26C\`, \`34A\`, \`2B\`, \`25C\`, \`12C\`, \`9F\`, \`7E\`, \`31E\`, \`6B\`, \`17A\`, \`1C\`, \`32B\`, \`13A\`, \`10D\`, \`28A\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  AIRLINE_RECORD_LOCATOR: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`MAFANN\`, \`NQTYBD\`, \`JRKKER\`, \`MQTWJB\`, \`JCDPNS\`, \`GGMVNP\`, \`JRJCDU\`, \`EVJTUD\`, \`RERWFH\`, \`VSJCZK\`, \`UVKBNK\`, \`XUHTXX\`, \`GHDEEQ\`, \`ASTQXK\`, \`WQZDNN\`, \`ACUGBH\`, \`RBCYWP\`, \`RRBWPX\`, \`PKKAXX\`, \`ASEJPV\`, \`ZMXREU\`, \`HNCZDW\`, \`KCGNEU\`, \`CZVYVC\`, \`WRVPYG\`, \`XPNRYR\`, \`DFZGAD\`, \`NTDGJM\`, \`HUFKNY\`, \`JAGDAD\`, \`UCMEPW\`, \`TSQJBB\`, \`CNHBRU\`, \`DYMCCJ\`, \`MQVSJJ\`, \`EXTXXD\`, \`AQZUAH\`, \`NUGDQQ\`, \`EGEUSE\`, \`RKBVGF\`, \`DRPJRU\`, \`GDEPPN\`, \`RFBDAS\`, \`REHRJR\`, \`NTYMNZ\`, \`KFJVGD\`, \`MWBMPT\`, \`GQNNAY\`, \`PQZXJD\`, \`RNKJWH\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  AIRLINE_FLIGHT_NUMBER: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`1734\`, \`17\`, \`63\`, \`62\`, \`67\`, \`3\`, \`4780\`, \`283\`, \`677\`, \`35\`, \`5676\`, \`5406\`, \`569\`, \`3259\`, \`7400\`, \`37\`, \`38\`, \`3214\`, \`45\`, \`5875\`, \`805\`, \`8712\`, \`930\`, \`6152\`, \`2517\`, \`486\`, \`376\`, \`102\`, \`324\`, \`1460\`, \`99\`, \`6\`, \`397\`, \`3279\`, \`81\`, \`60\`, \`8\`, \`772\`, \`6963\`, \`642\`, \`5045\`, \`323\`, \`5\`, \`4\`, \`7512\`, \`346\`, \`78\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  AIRLINE_AIRPORT_NAME: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ "Vienna International Airport", "Mexico City International Airport", "Cairns Airport", "Dallas Fort Worth International Airport", "Belem Val de Cans International Airport", "Fortaleza Pinto Martins International Airport", "Houari Boumediene Airport", "Wellington International Airport", "Murtala Muhammed International Airport", "George Bush Intercontinental Houston Airport", "Canberra Airport", "Melbourne International Airport", "Ministro Pistarini International Airport", "Vnukovo International Airport", "Daniel K. Inouye International Airport", "Dusseldorf Airport", "San Francisco International Airport", "Hong Kong International Airport", "Salvador Deputado Luis Eduardo Magalhaes International Airport", "Noumea Magenta Airport", "Jorge Chavez International Airport", "Seattle Tacoma International Airport", "Salgado Filho International Airport", "Brasilia-Presidente Juscelino Kubitschek International Airport", "Christchurch International Airport", "Kunming Changshui International Airport", "Dublin Airport", "Santos Dumont Airport", "Indira Gandhi International Airport", "Shanghai Pudong International Airport", "Charles de Gaulle International Airport", "McCarran International Airport", "Suvarnabhumi Airport", "Gold Coast Airport", "Perth Airport", "Auckland International Airport", "Eleftherios Venizelos International Airport", "Soekarno-Hatta International Airport", "Singapore Changi Airport", "Toronto Pearson International Airport", "Kuala Lumpur International Airport" ], { limit: ${JSON.stringify(field.maxLength)} })`,
  AIRLINE_AIRPORT_IATA_CODE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ "CTU", "SEA", "DXB", "SGN", "DFW", "NBO", "SZX", "CNF", "CBR", "CGH", "ARN", "LHR", "JED", "CJU", "BSB", "BOM", "ALG", "TXL", "GIG", "CDG", "SHA", "PPT", "MCO", "IAH", "VKO", "FOR", "MAD", "KMG", "KUL", "NOU", "DME", "SVO", "ATL", "OSL", "CAI", "CWB", "SDU", "OOL", "ADL", "SYD", "ADD", "SFO", "CLO", "CGK" ], { limit: ${JSON.stringify(field.maxLength)} })`,
  AIRLINE_AIRPLANE_NAME: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ "Boeing 737-400", "Airbus A330-800neo", "Airbus A320neo", "Tupolev Tu-134", "Boeing 767-300", "McDonnell Douglas MD82", "Boeing 747-400D", "Boeing 727-200", "Airbus A330-200", "Airbus A340-200", "Yakovlev Yak-40", "Ilyushin IL114", "Boeing 747SP", "Antonov An-26", "Canadair Regional Jet 900", "Boeing 767", "Airbus A350-900", "Ilyushin IL18", "Airbus A321neo", "Airbus A330-900neo", "De Havilland Canada DHC-8-300 Dash 8 / 8Q", "Canadair Regional Jet 700", "Douglas DC-3", "Lockheed L-1049 Super Constellation", "Airbus A340-500", "Boeing 777-200", "De Havilland DH.104 Dove", "Boeing 707", "Douglas DC-10-10", "Douglas DC-6", "Canadair Regional Jet 100", "Airbus A310-300", "De Havilland Canada DHC-8-100 Dash 8 / 8Q", "McDonnell Douglas MD80", "Canadair Regional Jet 200", "Antonov An-158", "Antonov An-24", "Boeing 747SR", "Tupolev Tu-154", "Airbus A340", "Airbus A350" ], { limit: ${JSON.stringify(field.maxLength)} })`,
  AIRLINE_AIRPLANE_IATA_TYPE_CODE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ "333", "320", "717", "7MJ", "CR9", "AN7", "DHD", "T20", "IL7", "380", "737", "SU9", "773", "330", "D8Q", "EM2", "D92", "321", "DH1", "M81", "L49", "DHH", "A40", "B72", "346", "342", "789", "732", "M11", "742", "M87", "74J", "735", "762", "D8L", "A32", "AN4", "ERD", "73G", "744", "TU3", "DH3", "EP3", "DH2" ], { limit: ${JSON.stringify(field.maxLength)} })`,
  AIRLINE_AIRLINE_NAME: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ "Beijing Capital Airlines", "Aerolineas Argentinas", "Air Algerie", "AirAsia", "Kenya Airways", "Nordwind Airlines", "Linea Aerea Amaszonas", "Cebu Pacific Air", "Emirates Airlines", "Republic Airways", "Frontier Airlines", "IndiGo Airlines", "Jeju Air", "Cathay Pacific", "Flybondi", "WestJet", "SpiceJet", "Air Transat", "SkyWest Airlines", "EasyJet", "Norwegian Air Shuttle", "Southwest Airlines", "EVA Air", "Turkish Airlines", "Boliviana de Aviacion", "China Eastern Airlines", "Air Mauritius", "Air China", "LATAM Airlines", "Thai AirAsia", "Condor", "Gol Linhas Aereas Inteligentes", "British Airways", "EcoJet", "Avianca", "Delta Air Lines", "FlySafair", "Malaysia Airlines", "Azur Air", "VivaAerobus", "Aegean Airlines" ], { limit: ${JSON.stringify(field.maxLength)} })`,
  AIRLINE_AIRLINE_IATA_CODE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ "JA", "NH", "3U", "SC", "DY", "U6", "H2", "LY", "WN", "AH", "SA", "FA", "BA", "FO", "8J", "9R", "OO", "VT", "9S", "TU", "MN", "LO", "HA", "JT", "TG", "Y4", "Z8", "SG", "AZ", "UL", "5J", "OZ", "EK", "MK", "2Z", "AA", "AY", "HU", "CI", "DL", "AF", "MH", "PX", "2I" ], { limit: ${JSON.stringify(field.maxLength)} })`,
  AIRLINE_AIRCRAFT_TYPE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`regional\`, \`narrowbody\`, \`widebody\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  LOCATION_NEARBY_G_P_S_COORDINATE: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`-35.862,169.3761\`, \`29.9327,-176.5523\`, \`46.7842,-86.8615\`, \`-76.072,92.8484\`, \`-63.7822,-39.0947\`, \`41.8255,112.0553\`, \`48.6492,-126.389\`, \`10.135,82.8951\`, \`-13.7582,23.6456\`, \`44.0211,96.4841\`, \`57.1088,-9.1351\`, \`-44.0129,41.8889\`, \`-23.1101,-32.5009\`, \`84.3852,19.5608\`, \`79.9123,64.2546\`, \`84.1495,60.1722\`, \`-26.2844,-28.5741\`, \`-40.1114,-162.5394\`, \`61.7962,-100.6424\`, \`85.7455,-43.1974\`, \`36.068,163.7323\`, \`-20.1999,44.5358\`, \`-79.9725,-53.1527\`, \`22.4264,-72.3156\`, \`-4.4961,177.7518\`, \`-20.1187,-115.0953\`, \`-24.1674,97.6745\`, \`88.8215,52.0941\`, \`68.3272,131.538\`, \`-35.3822,21.5759\`, \`77.6132,-11.974\`, \`45.1215,73.3037\`, \`88.5867,141.4572\`, \`79.8255,79.2618\`, \`37.9194,-130.7304\`, \`-75.1141,-79.1784\`, \`-49.829,71.3271\`, \`58.676,84.9664\`, \`75.2319,-81.2788\`, \`80.397,-128.2652\`, \`-55.7531,-132.4185\`, \`-41.6647,78.9461\`, \`43.0365,103.7882\`, \`15.1213,171.6909\`, \`31.4132,27.6052\`, \`70.6738,-22.2059\`, \`-52.5759,-114.8095\`, \`44.5607,27.3256\`, \`-64.0516,-62.6055\`, \`-54.3123,88.3781\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  LOCATION_DIRECTION: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`North\`, \`West\`, \`Northwest\`, \`Southeast\`, \`Northeast\`, \`Southwest\`, \`South\`, \`East\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  LOCATION_BUILDING_NUMBER: ({ input, field }) =>
    `copycat.oneOfString( ${input} , [ \`6813\`, \`8634\`, \`3335\`, \`8903\`, \`967\`, \`329\`, \`54659\`, \`1246\`, \`1866\`, \`5148\`, \`898\`, \`3878\`, \`2980\`, \`6719\`, \`85040\`, \`4697\`, \`12808\`, \`322\`, \`6971\`, \`50641\`, \`85077\`, \`1004\`, \`63254\`, \`333\`, \`38333\`, \`428\`, \`538\`, \`390\`, \`4955\`, \`8024\`, \`7795\`, \`94785\`, \`7027\`, \`6278\`, \`8926\`, \`595\`, \`311\`, \`6909\`, \`6403\`, \`530\`, \`33869\`, \`8097\`, \`9032\`, \`711\`, \`80813\`, \`941\`, \`285\`, \`1116\`, \`7556\`, \`320\` ], { limit: ${JSON.stringify(field.maxLength)} })`,
  //Falso
  AWS_REGION: ({ input, field }) =>
    `copycat.oneOfString( ${input}, ['us-east-2','us-east-1','us-west-1','us-west-2','af-south-1','ap-east-1','ap-southeast-3','ap-south-1','ap-northeast-3','ap-northeast-2','ap-southeast-1','ap-southeast-2','ap-northeast-1','ca-central-1','cn-north-1','cn-northwest-1','eu-central-1','eu-west-1','eu-west-2','eu-south-1','eu-west-3','eu-north-1','me-south-1','sa-east-1' ], { limit: ${JSON.stringify(field.maxLength)} })`,
  AWS_ARN: ({ input, field }) =>
    `copycat.oneOfString( ${input}, [
   'arn:aws-cn:s3:::/usr/ports/*',
   'arn:aws-us-gov:iam::669251785:group/*',
   'arn:aws-us-gov:s3:::/boot/defaults/*',
   'arn:aws-cn:lambda:ap-southeast-1:145411421:function:berkshireg.pdf',
   'arn:aws:iam::567047565:group/*',
   'arn:aws:lambda:us-gov-east-1:685613203:function:synthesizing-executive-specialist.pdf',
   'arn:aws-cn:s3:::/Library/*',
   'arn:aws-cn:iam::766268507:group/*',
   'arn:aws-us-gov:iam::660532693:user/*',
   'arn:aws-us-gov:iam::723615535:group/*',
   'arn:aws:iam::713244668:group/*',
   'arn:aws-cn:lambda:eu-west-1:455140159:function:plug-and-play.pdf',
   'arn:aws:s3:::/etc/mail/*',
   'arn:aws:lambda:us-west-1:661244280:function:kroon.pdf',
   'arn:aws-cn:lambda:ap-south-1:683920585:function:music-payment-payment.pdf',
   'arn:aws:lambda:us-west-1:889644688:function:team-oriented-ivory.pdf',
   'arn:aws-cn:lambda:af-south-1:412621112:function:incredible-azure-interface.pdf',
   'arn:aws:sqs:ap-southeast-1:740561172:queue3',
   'arn:aws:iam::341476206:group/*',
   'arn:aws-us-gov:lambda:us-west-1:826175151:function:white-wireless-garden.pdf',
   'arn:aws-cn:iam::800226213:group/*',
   'arn:aws-cn:s3:::/opt/*',
   'arn:aws-cn:iam::283370921:user/*',
   'arn:aws-us-gov:iam::376747624:group/*',
   'arn:aws:iam::850657175:group/*',
   'arn:aws-us-gov:iam::471683944:group/*',
   'arn:aws-cn:iam::066471671:group/*',
   'arn:aws-cn:sqs:af-south-1:717553171:queue2',
   'arn:aws:iam::786410687:user/*',
   'arn:aws:s3:::/bin/*',
   'arn:aws-us-gov:lambda:ap-northeast-1:647895250:function:transmit-borders-input.pdf',
   'arn:aws-us-gov:s3:::/usr/libexec/*',
   'arn:aws:iam::975751231:user/*',
   'arn:aws:s3:::/usr/src/*',
   'arn:aws:lambda:me-south-1:285835682:function:peso.pdf',
   'arn:aws-us-gov:iam::850272035:user/*',
   'arn:aws:s3:::/usr/local/src/*',
   'arn:aws-cn:lambda:af-south-1:289706488:function:fiji.pdf',
   'arn:aws:sqs:ap-east-1:872558283:queue6',
   'arn:aws:iam::635831451:group/*',
   'arn:aws:s3:::/Users/*',
   'arn:aws:s3:::/boot/defaults/*',
   'arn:aws-us-gov:iam::385311622:user/*',
   'arn:aws-cn:sqs:us-gov-west-1:214227836:queue8',
   'arn:aws:s3:::/var/tmp/*',
   'arn:aws:iam::893750132:user/*',
   'arn:aws-us-gov:iam::226554226:user/*',
   'arn:aws-us-gov:sqs:ap-northeast-1:948063052:queue7',
   'arn:aws:iam::227217226:user/*',
   'arn:aws-us-gov:iam::794595835:group/*'
 ], { limit: ${JSON.stringify(field.maxLength)} })`,
  AWS_SERVICE: ({ input, field }) =>
    `copycat.oneOfString( ${input}, [
   'CloudFront',  'ElastiCache',
   'API Gateway', 'EC2',
   'Cognito',     'S3',
   'AppSync',     'SNS',
   'SQS',         'VPC',
   'RDS',         'Kinesis',
   'EBS',         'CloudWatch',
   'Athena',      'Dynamo DB',
   'Lambda'
 ], { limit: ${JSON.stringify(field.maxLength)} })`,
  DRINKS: ({ input, field }) =>
    `copycat.oneOfString( ${input}, [
   'White Wine',
   'Still Water',
   'Gin and Tonic',
   'Margarita',
   'Pineapple Juice',
   'Brandy',
   'Natural Vanilla Syrup',
   'Irish Coffee',
   'Sangria',
   'Cocktail',
   'Clover Club',
   'Pina Colada',
   'Creme de Noyaux',
   'Orange Soda',
   'Negroni',
   'Screwdriver',
   'Red Wine',
   'Pineapple Soda',
   'Pineapple Gingerale',
   'Cosmopolitan',
   'Creme de Cacao',
   'Bronx Cocktail',
   'Creme de Cassis',
   'Coffee-flavored liqueur',
   'Creme de Menthe',
   'Zombie',
   'Daiquiri',
   'Jack Rose',
   'Sazerac',
   'Raspberry Lemon Drop',
   'Mai Tai',
   'Mimosa',
   'Liqueur'
 ], { limit: ${JSON.stringify(field.maxLength)} })`,
  BOOK_TITLE: ({ input, field }) =>
    `copycat.oneOfString( ${input}, [ 'King Solomon’s Mines',
 'Bel-Ami',
 'Little Women',
 'Howards End',
 'Far From the Madding Crowd',
 'Thank You Jeeves',
 'Frankenstein',
 'Great Apes',
 'The Hitchhikers Guide to the Galaxy',
 'The Life and Opinions of Tristram Shandy, Gentleman',
 'Pride and Prejudice',
 'Le Pere Goriot',
 'Childhood’s End',
 'Molesworth',
 'The Count of Monte Cristo',
 'The Great Gatsby',
 'Who Do You Think You Are?',
 'White Teeth',
 'The Thirty-Nine Steps',
 'A Confederacy of Dunces',
 'The Scarlet Letter',
 'Steppenwolf',
 'Nineteen Eighty-Four',
 'Wuthering Heights',
 'Around the World in Eighty Days',
 'The Hound of the Baskervilles',
 'A Girl in Winter',
 'The Man who was Thursday',
 'A Time to Kill',
 'Breakfast of Champions',
 'How Green was My Valley',
 'The Jungle',
 'The Chronicles of Narnia',
 'Foundation',
 'Les Miserables',
 'The Strange Case of Dr Jekyll and Mr Hyde',
 'For Whom the Bell Tolls',
 'The Three Musketeers',
 'The Shining',
 'Dead Souls',
 'One Flew Over the Cuckoo’s Nest'], { limit: ${JSON.stringify(field.maxLength)} })`,
  BOOK_AUTHOR: ({ input, field }) =>
    `copycat.oneOfString( ${input}, [
   'Jack Kerouac',          'Len Deighton',
   'Victor Hugo',           'John Buchan',
   'Ken Kesey',             'Oscar Wilde',
   'Daphne du Maurier',     'Stephen King',
   'Philip K Dick',         'Jonathan Swift',
   'PG Wodehouse',          'George Eliot',
   'Thomas Mann',           'Johann Wolfgang Goethe',
   'Jane Austen',           'Jerome K Jerome',
   'Margaret Mitchell',     'Sir Walter Scott',
   'Guy de Maupassant',     'Charlotte Bronte',
   'JRR Tolkien',           'George Orwell',
   'Jules Verne',           'John Steinbeck',
   'Mary Shelley',          'John le Carre',
   'Fyodor Dostoevsky',     'Boris Pasternak',
   'Gustave Flaubert',      'Graham Greene',
   'Harriet Beecher Stowe', 'Albert Camus',
   'Miguel de Cervantes',   'JD Salinger',
   'Emily Bronte',          'Terry Pratchett',
   'Will Self',             'Herman Hesse',
   'Thomas Hardy',          'Robert Harris',
   'Philip Larkin',         'Richard Llewellyn',
   'Michael Crichton',      'Charles Dickens',
   'Ursula Le Guin'
 ], { limit: ${JSON.stringify(field.maxLength)} })`,
  BOOK_CATEGORY: ({ input, field }) =>
    `copycat.oneOfString( ${input}, [
   'Family and Self',
   'Love',
   'Science Fiction and Fantasy',
   'Crime',
   'War and Travel',
   'Comedy',
   'State of the Nation'
 ], { limit: ${JSON.stringify(field.maxLength)} })`,
  POST_TITLE: ({ input }) => `copycat.sentence( ${input})`,
  POST_COMMENT: ({ input }) => `copycat.sentence( ${input})`,
  POST_BODY: ({ input }) => `copycat.paragraph( ${input})`,
  FOOD: ({ input, field }) =>
    `copycat.oneOfString( ${input}, [ 'Briam',
 'Empanadas',
 'Gaeng massaman',
 'Iahnie de fasole',
 'Hoy tod',
 'Arroz con Pollo',
 'Arepa',
 'Arroz con pollo',
 'Fasolada',
 'Tamagoyaki',
 'Curanto',
 'Llunca de gallina',
 'Pizza fugazeta',
 'Bagna cauda',
 'Edamame',
 'Takoyaki',
 'Clătitele cu gem',
 'Tiramisù',
 'Moussaka',
 'Chicken Burrito',
 'Shabu Shabu',
 'Pastel de choclo',
 'Profiteroles',
 'Quesillo',
 'Bandeja paisa',
 'Garlic bread',
 'Enchiladas',
 'Beef fried rice',
 'Halva',
 'Sopa de mondongo',
 'Kumpir',
 'Feta Cheese with Honey',
 'Flor de izote con huevo',
 'Gorditas de Nata',
 'Pupusa',
 'vegetable chow mein',
 'Balila',
 'Mote con huesillos',
 'Kao ka moo',
 'Rigua',
 'Birria de chivo'], { limit: ${JSON.stringify(field.maxLength)} })`,
  MOTORCYCLE: ({ input, field }) =>
    `copycat.oneOfString( ${input}, [
   'Benelli',          'Daelim',
   'KTM',              'SYM',
   'Suzuki',           'Gas Gas',
   'Kawasaki',         'Yamaha',
   'Husqvarna',        'Bultaco',
   'Honda',            'Keeway',
   'Harley-Davidson',  'Hyosung',
   'Royal Enfield',    'Triumph',
   'Moto Guzzi',       'BMW Motorrad',
   'Cagiva',           'Indian Motorcycle',
   'Zero Motorcycles', 'Gilera',
   'Ducati',           'MV Agusta'
 ], { limit: ${JSON.stringify(field.maxLength)} })`,
  MOVIE_TITLE: ({ input, field }) =>
    `copycat.oneOfString( ${input}, [
   'The Terminator',
'Aliens',
'Léon: The Professional',
'The Wizard of Oz',
'The Lord of the Rings: The Fellowship of the Ring',
'Witness for the Prosecution',
'Citizen Kane',
'Alien',
'Hacksaw Ridge',
'The Gold Rush',
'Cool Hand Luke',
'Rear Window',
'Braveheart',
'L.A. Confidential',
'Into the Wild',
'Double Indemnity',
'To Kill a Mockingbird',
'Room',
'Once Upon a Time in the West',
'Platoon',
'M',
'Full Metal Jacket',
'The Shawshank Redemption',
'Once Upon a Time in America',
'The Deer Hunter',
'Million Dollar Baby',
'Shutter Island',
'Taxi Driver',
'1917',
'2001: A Space Odyssey',
'North by Northwest',
'Gladiator',
'Oldboy',
'The Godfather',
'The Lord of the Rings: The Return of the King',
'Chinatown',
'The Intouchables',
'Requiem for a Dream',
'Grave of the Fireflies',
'In the Name of the Father',
'The Bridge on the River Kwai',
'Metropolis',
'Green Book',
'Before Sunset'
 ], { limit: ${JSON.stringify(field.maxLength)} })`,
  MOVIE_CHARACTER: ({ input, field }) =>
    `copycat.oneOfString( ${input}, [
   'Vito Corleone',      'Norman Bates',
   'Groot',              'Shaun Riley',
   'Forrest Gump',       'Samwise Gamgee',
   'Randle McMurphy',    'Hal',
   'Harry Potter',       'Lester Burnham',
   'Anton Chigurh',      'Jack Burton',
   'Amy Dunne',          'Hannibal Lecter',
   'Snake Plissken',     'Captain Kirk',
   'Legolas',            'Private William Hudson',
   'Frank Drebin',       'Captain Jack Sparrow',
   'Luke Skywalker',     'Red',
   'Tommy DeVito',       'Withnail',
   'Travis Bickle',      'Captain America',
   'Maximus',            'Yoda',
   'Donnie Darko',       'The Dude',
   'Rick Deckard',       'Daniel Plainview',
   'Aragorn',            'Captain Mal Reynolds',
   'Katniss Everdeen',   'Ace Ventura',
   'Inspector Clouseau', 'V'
 ], { limit: ${JSON.stringify(field.maxLength)} })`,
  MUSIC_SINGER: ({ input, field }) =>
    `copycat.oneOfString( ${input}, [
   'John Lennon',       'Van Morrison',
   'Freddie Mercury',   'Janis Joplin',
   'Rod Stewart',       'Sam Moore',
   'Ray Charles',       'Paul McCartney',
   'Kurt Cobain',       'Smokey Robinson',
   'Roger Daltrey',     'Sly Stone',
   'Art Garfunkel',     'Buddy Holly',
   'Annie Lennox',      'George Jones',
   'Hank Williams',     'Mary J. Blige',
   'Elvis Presley',     'Karen Carpenter',
   'Muddy Waters',      'Steve Winwood',
   'Mick Jagger',       'Gladys Knight',
   'Robert Plant',      'Otis Redding',
   'Frankie Valli',     'Wilson Pickett',
   'Bob Dylan',         'Lou Reed',
   'Morrissey',         'Roy Orbison',
   'Tina Turner',       'Björk',
   'Sam Cooke',         'Little Richard',
   'Bruce Springsteen', 'Darlene Love'
 ], { limit: ${JSON.stringify(field.maxLength)} })`,
  SPORTS: ({ input, field }) =>
    `copycat.oneOfString( ${input}, [
   'Hang Gliding',
   'Water Polo',
   'Rowing',
   'Luge',
   'Hockey',
   'Curling',
   'Snowboard',
   'Trampoline',
   'Golf',
   'Kite Flying',
   'Figure Skating',
   'Sport Climbing',
   'Artistic Swimming',
   'Running',
   'Monkey Bars',
   'Handball',
   'Skeleton',
   'Netball',
   'Volleyball',
   'High Jumping',
   'Equestrian',
   'Bobsleigh',
   'Judo',
   'Short Track Speed Skating',
   'Alpine Skiing',
   'Ski Jumping',
   'Shooting',
   'Badminton',
   'Sailing',
   'Modern Pentathlon',
   'Tennis',
   'Freestyle Skiing'
 ], { limit: ${JSON.stringify(field.maxLength)} })`,
  SPORTS_TEAM: ({ input, field }) =>
    `copycat.oneOfString( ${input}, [
   'Atlanta Hawks',        'Seattle Seahawks',
   'Crystal Palace',       'Washington Wizards',
   'Detroit Pistons',      'Milwaukee Brewers',
   'New York Giants',      'San Jose Sharks',
   'Atlanta Braves',       'Philadelphia 76ers',
   'Utah Jazz',            'Green Bay Packers',
   'Sydney FC',            'Washington Capitals',
   'Edmonton Oilers',      'Pittsburgh Pirates',
   'Granada',              'Minnesota Twins',
   'Independiente',        'Los Angeles Dodgers',
   'Burnley',              'Cincinnati Bengals',
   'Seattle Mariners',     'San Diego Padres',
   'Chicago Bulls',        'Buffalo Sabres',
   'Cincinnati Reds',      'New York Knicks',
   'Las Vegas Raiders',    'Colorado Avalanche',
   'New Orleans Pelicans', 'Washington Nationals',
   'Espanyol',             'Atlético Madrid',
   'Vancouver Canucks',    'Carolina Hurricanes',
   'Seattle Kraken',       'Golden State Warriors',
   'Tigre',                'Indiana Pacers',
   'Cleveland Browns',     'Arizona Coyotes',
   'Ipswich Town',         'Miami Heat'
 ], { limit: ${JSON.stringify(field.maxLength)} })`,
  PERMISSION: ({ input, field }) =>
    `copycat.oneOfString( ${input}, [ 'no permission', 'write', 'read', 'execute'], { limit: ${JSON.stringify(field.maxLength)} })`,
  ROLE: ({ input, field }) =>
    `copycat.oneOfString( ${input}, [ 'Owner', 'Contributor', 'Admin', 'Developer', 'Editor', 'Viewer' ], { limit: ${JSON.stringify(field.maxLength)} })`,
  RATING: ({ input }) => `copycat.int(${input}, {min: 1, max: 5}).toString()`,
  ENVIRONMENT_VARIABLE: ({ input }) => `copycat.word(${input})`,
  __DEFAULT: ({ input }) => `copycat.sentence(${input})`,
};

const maybeTruncate = (fn: TemplateFn): TemplateFn => {
  const maybeTruncateFn = (context: TemplateContext) => {
    const result = fn(context);

    if (result === null) {
      return result;
    }

    if (context.field.maxLength == null) {
      return result;
    }

    const serializedMaxLen = JSON.stringify(context.field.maxLength);

    if (result.includes(`limit: ${serializedMaxLen}`)) {
      return result;
    }

    return `(${result}).slice(0, ${serializedMaxLen})`;
  };

  return maybeTruncateFn;
};

// @ts-expect-error we know that the values are all TemplateFn
strings = mapValues(strings, maybeTruncate);
