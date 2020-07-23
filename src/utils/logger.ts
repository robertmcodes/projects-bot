import path from 'path'
import winston, { createLogger, transports, format } from 'winston'

export function init (): winston.Logger {
  const logPath = path.resolve(__dirname, '../../logs')

  const logger = createLogger({
    level: process.env.NODE_ENV !== 'development' ? 'info' : 'debug',
    format: format.json(),
    transports: [
      new transports.File({ filename: path.join(logPath, 'error.log'), level: 'error' }),
      new transports.File({ filename: path.join(logPath, 'full.log') }),
      new transports.Console({ format: format.combine(format.colorize(), format.simple()) })
    ]
  })

  return logger
}
