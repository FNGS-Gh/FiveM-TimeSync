interface TimeConfig {
  startTime: {
    h: number;
    m: number;
    s: number;
  };
  dayRatio: number;
  nightRatio: number;
}

// NOTE: Don't change this object.
// It contains default "safe" values in case the actual config is corrupred or can't be read.
const DEFAULT_CONFIG: TimeConfig = {
  startTime: {
    h: 6,
    m: 0,
    s: 0,
  },
  dayRatio: 30,
  nightRatio: 30,
} as const;

const isTimeConfig = (data: unknown): data is TimeConfig => {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;

  if (typeof obj.dayRatio !== 'number' || isNaN(obj.dayRatio) || obj.dayRatio <= 0) return false;
  if (typeof obj.nightRatio !== 'number' || isNaN(obj.nightRatio) || obj.nightRatio <= 0) return false;

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
    console.log('error');
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