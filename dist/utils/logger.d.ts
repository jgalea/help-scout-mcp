export interface LogContext {
    requestId?: string;
    duration?: number;
    [key: string]: unknown;
}
export declare class Logger {
    private level;
    constructor();
    private shouldLog;
    private log;
    error(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map