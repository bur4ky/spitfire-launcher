import { Logger } from 'tslog';
import { dev } from '$app/environment';

export const levelMap = {
  silly: 0,
  trace: 1,
  debug: 2,
  info: 3,
  warn: 4,
  error: 5,
  fatal: 6
} as const;

type LogLevel = keyof typeof levelMap;

export function getLevel(level: LogLevel) {
  const lvl = level.toLowerCase() as LogLevel;
  return lvl in levelMap ? levelMap[lvl] : levelMap.info;
}

const logger = new Logger({
  minLevel: getLevel('info'),
  type: 'pretty',

  prettyLogTemplate: '{{hh}}:{{MM}}:{{ss}}.{{ms}} {{logLevelName}} {{name}}{{logMessage}} {{logObject}}',
  prettyErrorTemplate: dev
    ? '\n{{errorName}} {{errorMessage}}\n{{errorStack}}'
    // Files and line numbers are not available in production builds
    : '\n{{errorName}} {{errorMessage}}',
  prettyErrorStackTemplate: '  • {{fileName}} {{method}}\n {{filePathWithLine}}',

  prettyErrorParentNamesSeparator: ':',
  prettyLogTimeZone: 'local'
});

const childLoggers: Logger<unknown>[] = [];

export function setLogLevel(level: LogLevel) {
  logger.settings.minLevel = getLevel(level);
  for (const child of childLoggers) {
    child.settings.minLevel = getLevel(level);
  }
}

// This is the only way to have a "global level"
export function getChildLogger(name: string) {
  const childLogger = logger.getSubLogger({ name });
  childLoggers.push(childLogger);
  return childLogger;
}

export default logger;