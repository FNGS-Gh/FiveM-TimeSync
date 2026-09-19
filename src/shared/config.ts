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
 * 
 * perfectFreeze: boolean     <- Description below:
 * Whether the time freezes completely.
 * With 'false', it adjusts the in-game clock every 250ms, which is practically unnoticable.
 * With 'true', it adjusts the in-game clock every tick, making the GetClockSeconds() return consistent values.
 */

interface TimeConfig {
  startTime: {
    h: number;
    m: number;
    s: number;
  };
  dayRatio: number;
  nightRatio: number;
  maxTimeOffset: number;
  perfectFreeze: boolean;
}

// NOTE: Don't change this object. Change only the 'config.json' outter file.
// This object contains default "safe" values in case the actual config is corrupred or can't be read.
const DEFAULT_CONFIG: TimeConfig = {
  startTime: {
    h: 6,
    m: 0,
    s: 0,
  },
  dayRatio: 30,
  nightRatio: 30,
  maxTimeOffset: 10,
  perfectFreeze: false
} as const;

const isTimeConfig = (data: unknown): data is TimeConfig => { 
  if (typeof data !== 'object' || data === null) return false; 

  const obj = data as Record<string, unknown>; 

  if (typeof obj.dayRatio !== 'number' || isNaN(obj.dayRatio) || obj.dayRatio <= 0) return false; 
  if (typeof obj.nightRatio !== 'number' || isNaN(obj.nightRatio) || obj.nightRatio <= 0) return false; 

  if (typeof obj.maxTimeOffset !== 'number' || isNaN(obj.maxTimeOffset) || obj.maxTimeOffset <= 0) return false;
  if (typeof obj.perfectFreeze !== 'boolean') return false;

  if (typeof obj.startTime !== 'object' || obj.startTime === null) return false; 

  const startTime = obj.startTime as Record<string, unknown>; 

  if (typeof startTime.h !== 'number' || isNaN(startTime.h) || startTime.h < 0 || startTime.h > 23) return false; 
  if (typeof startTime.m !== 'number' || isNaN(startTime.m) || startTime.m < 0 || startTime.m > 59) return false; 
  if (typeof startTime.s !== 'number' || isNaN(startTime.s) || startTime.s < 0 || startTime.s > 59) return false; 

  return true; 
};

const loadConfig = (): TimeConfig => {
  const resourceName = GetCurrentResourceName();
  const configFile = LoadResourceFile(resourceName, 'config.json');

  const configError = () => {
    console.error('Failed to load config.json');
    return DEFAULT_CONFIG;
  };

  if (!configFile) return configError();

  try {
    const rawConfig: unknown = JSON.parse(configFile);

    if (!isTimeConfig(rawConfig))
      return configError();

    return rawConfig;
  } catch (err) {
    return configError();
  }
};

export const Config = loadConfig();