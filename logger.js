const fs = require('fs');
const path = require('path');

function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

function logError(error) {
    const timestamp = getTimestamp();
    const logMessage = `[${timestamp}] ${error}\n`;
    const logFilePath = path.join(__dirname, 'error-log.txt');

    fs.access(logFilePath, fs.constants.F_OK, (err) => {
        if (err) {
            fs.writeFile(logFilePath, logMessage, 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error('Failed to create log file:', writeErr);
                }
            });
        } else {
            fs.appendFile(logFilePath, logMessage, 'utf8', (appendErr) => {
                if (appendErr) {
                    console.error('Failed to append to log file:', appendErr);
                }
            });
        }
    });
}

module.exports = { logError };
