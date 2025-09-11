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


export {getClientCurrentDate, getClientCurrentDateFromInput, getClientCurrentTimeFromInput};
