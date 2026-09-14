interface TimeConfig {
  startTime: {
    h: number;
    m: number;
    s: number;
  };
  ratio: number;
}

const DEFAULT_CONFIG: TimeConfig = {
  startTime: {
    h: 6,
    m: 0,
    s: 0,
  },
  ratio: 30,
} as const;

const loadConfig = (): TimeConfig => {
  const resourceName = GetCurrentResourceName();
  const configFile = LoadResourceFile(resourceName, 'config.json');

  const configError = () => {
    console.error('Failed to load config.json');
    return DEFAULT_CONFIG;
  };

  if (!configFile) return configError();

  const config = JSON.parse(configFile) as TimeConfig;
  if (!config) return configError();

  return config;
};

export const Config = loadConfig();