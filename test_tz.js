const { fromZonedTime, toZonedTime, formatInTimeZone } = require('date-fns-tz');
const { format } = require('date-fns');

const inputStr = "2026-08-23T10:30";
const jakartaTz = 'Asia/Jakarta';

const d = fromZonedTime(inputStr, jakartaTz);
console.log("fromZonedTime:", d.toISOString());

const formattedStr = formatInTimeZone(d, jakartaTz, "yyyy-MM-dd'T'HH:mm");
console.log("formatted back:", formattedStr);
