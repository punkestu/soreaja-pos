const { format } = require('date-fns');
const d = new Date("2026-08-23T01:00:00Z"); // 08:00 Jakarta time
const jakartaOffset = 7 * 60;
const localOffset = d.getTimezoneOffset();
const localD = new Date(d.getTime() + (jakartaOffset + localOffset) * 60000);
console.log("Original:", d.toISOString(), format(d, 'yyyy-MM-dd HH:mm'));
console.log("JakartaLocal:", localD.toISOString(), format(localD, 'yyyy-MM-dd HH:mm'));
