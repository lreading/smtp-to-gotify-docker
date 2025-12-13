import { createLogger, format, Logger, transports } from 'winston';

const baseFormat = format.combine(
    format.timestamp(),
    format.json()
);

export const getLogger = (service: string): Logger => {
    return createLogger({
        level: 'info',
        format: baseFormat,
        defaultMeta: { service },
        transports: [
            new transports.File({ filename: 'error.log', level: 'error' }),
            new transports.File({ filename: 'combined.log' }),
            new transports.Console()
        ],
    });
}
