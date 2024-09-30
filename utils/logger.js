const fs = require('fs');
const path = require('path');

class Logger {
    constructor(logFilePath) {
        this.logFilePath = logFilePath || path.join(__dirname, '../logs/application.log');
    }

    // Private method to get the filename from where the log is called
    _getCallerFile() {
        const originalFunc = Error.prepareStackTrace;
        let callerfile;

        try {
            const err = new Error();

            // Overwrite the prepareStackTrace to capture the stack trace
            Error.prepareStackTrace = (err, stack) => stack;

            const stack = err.stack;

            // Start iterating from the 2nd frame because the first frame is this function itself
            for (let i = 2; i < stack.length; i++) {
                const file = stack[i] && stack[i].getFileName ? stack[i].getFileName() : null;

                // Ensure we don't capture internal node_modules or logger itself
                if (file && !file.includes('node_modules') && !file.includes('logger.js')) {
                    callerfile = file;
                    break;
                }
            }
        } catch (e) {
            console.error('Error retrieving stack trace', e);
        } finally {
            // Restore the original prepareStackTrace method
            Error.prepareStackTrace = originalFunc;
        }

        // Return the caller filename or 'unknown' as a fallback
        return callerfile ? path.basename(callerfile) : 'unknown';
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const callerFile = this._getCallerFile(); // Get the caller file
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${callerFile}]: ${message}\n`;

        // Write to console
        console.log(logMessage.trim());

        // Append to the log file
        fs.appendFileSync(this.logFilePath, logMessage, { encoding: 'utf8' });
    }

    info(message) {
        this.log(message, 'info');
    }

    warn(message) {
        this.log(message, 'warn');
    }

    error(message) {
        this.log(message, 'error');
    }

    debug(message) {
        this.log(message, 'debug');
    }
}

const logger = new Logger();
module.exports = { logger };
