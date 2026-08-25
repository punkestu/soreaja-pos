import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';

const TZ = 'Asia/Jakarta';

export function parseTz(dateStr: string | Date): Date {
  if (dateStr instanceof Date) return dateStr;
  return fromZonedTime(dateStr, TZ);
}

export function formatTz(date: Date | number | string, formatStr: string): string {
  return formatInTimeZone(date, TZ, formatStr);
}

export function toTzString(date: Date | string | number): string {
  return new Date(date).toLocaleString('en-US', { timeZone: TZ });
}

export function getTzDateInput(date: Date | string | number): string {
  return formatInTimeZone(date, TZ, "yyyy-MM-dd'T'HH:mm");
}

export function getJakartaLocal(date: Date | string | number): Date {
  const d = new Date(date);
  const jakartaOffset = 7 * 60; // +07:00 in minutes
  const localOffset = d.getTimezoneOffset(); // in minutes
  return new Date(d.getTime() + (jakartaOffset + localOffset) * 60000);
}
