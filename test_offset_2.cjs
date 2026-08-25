const { formatInTimeZone } = require('date-fns-tz');

// Local time 00:00 in UTC+12 is 12:00 UTC previous day.
const d = new Date("2026-07-31T12:00:00Z"); 
console.log(formatInTimeZone(d, 'Asia/Jakarta', 'MMM dd'));
