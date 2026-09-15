interface TimeConfig {
  startTime: {
    h: number;
    m: number;
    s: number;
  };
  dayRatio: number;
  nightRatio: number;
  maxTimeOffset: number;
  syncCheckInterval: number;
  perfectFreeze: boolean;
}

/* 
 * CONFIG BREAKDOWN:
 * -----------------
 * startTime: object          <- Time that will be set upon the resource mounting;
 * - h: number                <- Start hour:   [0 <= h < 24];
 * - m: number                <- Start minute: [0 <= m < 60];
 * - s: number                <- Start second: [0 <= s < 60];
 * dayRatio: number           <- In-game seconds ratio to IRL seconds (e.g. 30:1);
 * nightRatio: number         <- Same as above but for the night cycle only;
 * maxTimeOffset: number      <- (seconds) Max allowed client time offset before a re-sync happens;
 * syncCheckInterval: number  <- (milliseconds) Interval to check the client time offset.
 *                             \_ The bigger the ratio, the bigger the value here;
 * 
 * perfectFreeze: boolean     <- Description below:
 * Whether the time freezes completely.
 * With 'false', it adjusts the in-game clock every 250ms, which is practically unnoticable.
 * With 'true', it adjusts the in-game clock every tick, making the GetClockSeconds() return consistent values.
 */

export const Config: TimeConfig = {
  startTime: {
    h: 6,
    m: 0,
    s: 0,
  },
  dayRatio: 30,
  nightRatio: 30,
  maxTimeOffset: 10,
  syncCheckInterval: 5000,
  perfectFreeze: false
} as const;