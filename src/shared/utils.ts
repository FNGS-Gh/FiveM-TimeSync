export interface TimeHMS {
  h: number;
  m: number;
  s: number;
}

export interface SyncPayload {
  lastTimer: number;
  gameTime: number;
  ratio: number;
}

export interface AllPayload extends SyncPayload {
  isFrozen: boolean;
}

export const DAY_SECONDS = 86400;     // 24 * 3600
export const SUNRISE_SECONDS = 19800; // 05:30 in-game sunrise time (5.5 * 3600)
export const SUNSET_SECONDS = 72000;  // 20:00 in-game sunset time (20.0 * 3600)

export const normDayTime = (timeInSec: number): number =>
  ((timeInSec % DAY_SECONDS) + DAY_SECONDS) % DAY_SECONDS;

export const normHMS = ({ h, m, s }: TimeHMS): TimeHMS => ({
  h: Math.min(23, Math.max(0, h)),
  m: Math.min(59, Math.max(0, m)),
  s: Math.min(59, Math.max(0, s))
});

export const getTimeToHMS = (timeInSec: number): TimeHMS => ({
  h: Math.floor(timeInSec / 3600),
  m: Math.floor((timeInSec % 3600) / 60),
  s: Math.floor(timeInSec % 60),
});

export const getHMSToTime = ({ h, m, s }: TimeHMS): number => 
  Math.floor(h) * 3600 + Math.floor(m) * 60 + Math.floor(s);

export const isDaytime = (timeInSec: number) =>
  timeInSec >= SUNRISE_SECONDS && timeInSec < SUNSET_SECONDS;

export const calcTime = (
  timerStart: number,
  timerNow: number,
  prevTime: number,
  ratio: number
): number => {
  const elapsedRealS = Math.abs(timerNow - timerStart) / 1000;
  const elapsedGameS = elapsedRealS * ratio;

  const totalTime = prevTime + elapsedGameS;
  
  return normDayTime(totalTime);
}