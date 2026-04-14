import { config } from './config.js';
export class Logger {
    constructor() {
        this.level = config.logging.level;
    }
    shouldLog(level) {
        const levels = ['error', 'warn', 'info', 'debug'];
        const currentLevelIndex = levels.indexOf(this.level);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex <= currentLevelIndex;
    }
    log(level, message, context = {}) {
        if (!this.shouldLog(level))
            return;
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...context,
        };
        // Write logs to stderr to avoid interfering with MCP protocol on stdout
        console.error(JSON.stringify(logEntry));
    }
    error(message, context = {}) {
        this.log('error', message, context);
    }
    warn(message, context = {}) {
        this.log('warn', message, context);
    }
    info(message, context = {}) {
        this.log('info', message, context);
    }
    debug(message, context = {}) {
        this.log('debug', message, context);
    }
}
export const logger = new Logger();
//# sourceMappingURL=logger.js.map