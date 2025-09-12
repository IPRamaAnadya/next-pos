import { formatInTimeZone, toDate, toZonedTime} from "date-fns-tz";

function getClientCurrentDate(req: Request) {
  const clientTimezone = req.headers.get('X-Timezone-Name') || 'Asia/Jakarta';
  const now = new Date();
  const localNow = formatInTimeZone(now, clientTimezone, 'yyyy-MM-dd');
  return new Date(localNow);
}

function getClientCurrentDateFromInput(req: Request, value: string) {
  const clientTimezone = req.headers.get('X-Timezone-Name') || 'Asia/Jakarta';
  const clientDate = new Date(value);
  const localNow = formatInTimeZone(clientDate, clientTimezone, 'yyyy-MM-dd');
  return new Date(localNow);
}

function getClientCurrentTimeFromInput(req: Request, value: string) {
  const clientTimezone = req.headers.get('X-Timezone-Name') || 'Asia/Jakarta';
  const clientTime = new Date(value);
  const localNow = formatInTimeZone(clientTime, clientTimezone, 'yyyy-MM-dd HH:mm:ss');
  return new Date(localNow);
}


function getClientCurrentTime(req: Request) {
  const clientTimezone = req.headers.get('X-Timezone-Name') || 'Asia/Jakarta';
  const clientTime = new Date();
  const time = formatInTimeZone(clientTime, clientTimezone, 'HH:mm:ss');
  return time;
}

function calculateWorkHours(checkInTime: string, checkOutTime: string): number {
  const checkIn = new Date(`2024-01-01T${checkInTime}`);
  const checkOut = new Date(`2024-01-01T${checkOutTime}`);

  let diffInMilliseconds = checkOut.getTime() - checkIn.getTime();

  // Tangani kasus di mana waktu kerja melewati tengah malam
  if (diffInMilliseconds < 0) {
    diffInMilliseconds += 24 * 60 * 60 * 1000;
  }

  // Konversi milidetik ke jam
  const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

  return diffInHours;
}


export {getClientCurrentDate, getClientCurrentDateFromInput, getClientCurrentTimeFromInput, getClientCurrentTime, calculateWorkHours};
