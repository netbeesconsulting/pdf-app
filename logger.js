const fs = require('fs-extra');
const path = require('path');

// Function to get current timestamp in a readable format
function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

// Function to create a new folder and log file if not existing and write error log
async function logError(error) {
    const timestamp = getTimestamp();
    const date = new Date();
    const folderName = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const folderPath = path.join(__dirname, 'logs', folderName);

    // Ensure the folder exists
    await fs.ensureDir(folderPath);

    const fileName = `${folderName}-${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}-${date.getSeconds().toString().padStart(2, '0')}.txt`;
    const filePath = path.join(folderPath, fileName);

    const logMessage = `[${timestamp}] ${error}\n`;

    // Append error log to the file
    await fs.appendFile(filePath, logMessage, 'utf8');
}

module.exports = { logError };
