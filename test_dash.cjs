const { formatInTimeZone } = require('date-fns-tz');
const { startOfMonth } = require('date-fns');

const d = new Date("2026-08-01T00:00:00Z"); // this is what startOfMonth would generate
console.log(formatInTimeZone(d, 'Asia/Jakarta', 'MMM dd'));
