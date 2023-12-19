import { createLogger, format, Logger, transports } from 'winston';

export const getLogger = (service: string): Logger => {
    return createLogger({
        level: 'info',
        format: format.json(),
        defaultMeta: { service },
        transports: [
            new transports.File({ filename: 'error.log', level: 'error' }),
            new transports.File({ filename: 'combined.log' }),
            new transports.Console({ format: process.env.NODE_ENV === 'production' ? format.json() : format.simple() })
        ],
    });
}
