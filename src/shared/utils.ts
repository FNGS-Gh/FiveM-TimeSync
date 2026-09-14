export interface ClientTime {
  h: number;
  m: number;
  s: number;
}

export interface SyncPayload {
  baseTimeInSec: number;
  startedAtStamp: number;
  dayRatio: number;
  nightRatio: number;
  frozen: boolean;
}

// Don't change these: they are always similar.
export const WHOLE_DAY = 86400; // 24 * 3600
export const SUNRISE = 19800;   // 05:30 in-game sunrise time (5.5 * 3600)
export const SUNSET = 72000;    // 20:00 in-game sunset time (20.0 * 3600)

export const normalizeTotal = (totalSeconds: number): number =>
  ((totalSeconds % WHOLE_DAY) + WHOLE_DAY) % WHOLE_DAY;

export const isDaytime = (timeInSec: number): boolean => {
  const norm = normalizeTotal(timeInSec);
  return norm >= SUNRISE && norm < SUNSET;
};

export const getTimeToHMS = (totalSeconds: number): ClientTime => {
  const normalized = normalizeTotal(totalSeconds);
  return {
    h: (normalized / 3600) | 0,
    m: ((normalized % 3600) / 60) | 0,
    s: (normalized % 60) | 0,
  };
};

export const getHMSToTime = ({ h, m, s }: ClientTime): number => 
  (s | 0) + (m | 0) * 60 + (h | 0) * 3600;

export const calculateCurrentTime = (
  baseTimeInSec: number,
  startedAtStamp: number,
  dayRatio: number,
  nightRatio: number
): number => {
  const elapsedRealSec = ((Date.now() - startedAtStamp) / 1000) | 0;
  if (elapsedRealSec <= 0) return normalizeTotal(baseTimeInSec);

  if (dayRatio === nightRatio)
    return normalizeTotal(baseTimeInSec + elapsedRealSec * dayRatio);

  const dayGameSec = SUNSET - SUNRISE;
  const nightGameSec = WHOLE_DAY - dayGameSec;

  const realSecDay = dayGameSec / dayRatio;
  const realSecNight = nightGameSec / nightRatio;
  const realSecFullCycle = realSecDay + realSecNight;

  let remainingRealSec = elapsedRealSec % realSecFullCycle;
  let currentSec = normalizeTotal(baseTimeInSec);

  let inDay = isDaytime(currentSec);
  let activeRatio = inDay ? dayRatio : nightRatio;
  let nextTargetSec = inDay
    ? SUNSET
    : (currentSec < SUNRISE ? SUNRISE : SUNRISE + WHOLE_DAY);

  let gameSecToBoundary = nextTargetSec - currentSec;
  if (gameSecToBoundary <= 0) gameSecToBoundary += WHOLE_DAY;

  let realSecToBoundary = gameSecToBoundary / activeRatio;

  if (remainingRealSec < realSecToBoundary)
    return normalizeTotal(currentSec + remainingRealSec * activeRatio);

  currentSec = normalizeTotal(nextTargetSec);
  remainingRealSec -= realSecToBoundary;

  inDay = isDaytime(currentSec);
  activeRatio = inDay ? dayRatio : nightRatio;
  const phaseFullRealSec = inDay ? realSecDay : realSecNight;

  if (remainingRealSec < phaseFullRealSec)
    return normalizeTotal(currentSec + remainingRealSec * activeRatio);

  nextTargetSec = inDay ? SUNSET : SUNRISE;
  currentSec = normalizeTotal(nextTargetSec);
  remainingRealSec -= phaseFullRealSec;
  
  const finalRatio = isDaytime(currentSec) ? dayRatio : nightRatio;
  return normalizeTotal(currentSec + remainingRealSec * finalRatio);
};