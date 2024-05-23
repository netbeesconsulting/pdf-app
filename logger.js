const fs = require('fs');
const path = require('path');

// Function to get current timestamp in a readable format
function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

// Function to log error to a single file, creating it if it doesn't exist
function logError(error) {
    const timestamp = getTimestamp();
    const logMessage = `[${timestamp}] ${error}\n`;
    const logFilePath = path.join(__dirname, 'error-log.txt');

    // Check if the log file exists, create it if it doesn't
    fs.access(logFilePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File does not exist, create it and write the first log entry
            fs.writeFile(logFilePath, logMessage, 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error('Failed to create log file:', writeErr);
                }
            });
        } else {
            // File exists, append the log entry
            fs.appendFile(logFilePath, logMessage, 'utf8', (appendErr) => {
                if (appendErr) {
                    console.error('Failed to append to log file:', appendErr);
                }
            });
        }
    });
}

module.exports = { logError };
