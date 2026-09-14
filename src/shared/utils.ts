export interface ClientTime {
  h: number;
  m: number;
  s: number;
}

export interface UpdateTimeParams {
  timeInSec: number;
  ratio: number;
}

export interface UpdateFreezeParams {
  timeInSec: number;
  status: boolean;
}

export const WHOLE_DAY = 3600 * 24; // 86400 seconds

const normalizeTime = (val: number) => Math.max(0, Math.min(59, val)) | 0;
const normalizeHour = (h: number) => Math.max(0, Math.min(23, h)) | 0;

export const normalizeTotal = (totalSeconds: number) => ((totalSeconds % WHOLE_DAY) + WHOLE_DAY) % WHOLE_DAY;

export const getTimeToHMS = (totalSeconds: number): ClientTime => {
  const normalized = normalizeTotal(totalSeconds);

  const h = (normalized / 3600) | 0;
  const m = ((normalized % 3600) / 60) | 0;
  const s = (normalized % 60) | 0;

  return { h, m, s };
};

export const getHMSToTime = ({ h, m, s }: ClientTime) => {
  const hour = normalizeHour(h);
  const minute = normalizeTime(m);
  const second = normalizeTime(s);
  return second + minute * 60 + hour * 3600;
}