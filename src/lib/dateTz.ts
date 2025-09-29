import { fromZonedTime } from 'date-fns-tz';

/**
 * Converts a local date/time string and a timezone name to a UTC ISO string.
 * @param localDateTime - e.g. '2025-08-01T00:00:00'
 * @param timeZone - e.g. 'Asia/Makassar'
 * @returns UTC ISO string, e.g. '2025-07-31T16:00:00.000Z'
 */
export function toUtcFromTz(localDateTime: string, timeZone: string): Date {
  return fromZonedTime(localDateTime, timeZone);
}
