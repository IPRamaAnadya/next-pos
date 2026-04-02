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

/**
 * Get utc time from current local time
 * @param timeZone - e.g. 'Asia/Makassar'
 * @returns UTC Date object representing e.g. '2025-08-14T16:00:00'
 */
export function getUtcFromLocal(timeZone: string): Date {
  const now = new Date();
  const localDateTime = now.toISOString().substring(0, 19); // 'YYYY-MM-DDTHH:mm:ss'
  return fromZonedTime(localDateTime, timeZone);
}


/**
 * Get the UTC Date object representing the start of the current day in the given timezone.
 * @param timeZone - e.g. 'Asia/Makassar'
 * @returns UTC Date object for the start of the current day in the given timezone
 */
export function getUtcStartOfCurrentDay(timeZone: string): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const localStartOfDay = `${year}-${month}-${day}T00:00:00`;
  return fromZonedTime(localStartOfDay, timeZone);
}