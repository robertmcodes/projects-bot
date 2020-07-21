import winston, { createLogger, transports, format } from 'winston'

export function init (): winston.Logger {
  const logger = createLogger({
    level: process.env.NODE_ENV !== 'development' ? 'info' : 'debug',
    format: format.json(),
    transports: [
      new transports.File({ filename: 'error.log', level: 'error' }),
      new transports.File({ filename: 'full.log' }),
      new transports.Console({ format: format.combine(format.colorize(), format.simple()) })
    ]
  })

  return logger
}
