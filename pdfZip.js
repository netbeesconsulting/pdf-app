
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const fileMap = new Map();
const app = express();
const PORT = process.env.PORT || 5001;
const downloadsDir = path.join(__dirname, 'PDFdownloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

app.use(express.json());

async function pdfZipDownload(NewUrlPdf, pdfUrls, urlArray, req, res, FolderName,file_name3) {

    const dFolder = 'PDFdownloads/'+FolderName;

    try {
        if (!fs.existsSync(dFolder)) {
            fs.mkdirSync(dFolder);
        }
    } catch (err) {
        console.error(err);
    }

    if (urlArray.length === pdfUrls.length) {
        if (pdfUrls.length === 1) {
            return res.status(400).json({ error: 'one Url sendded - please try again' });
        } else {
            const pdfFiles = [];
            const downloadPromises = pdfUrls.map(async (url, index) => {
                const response2 = await axios({
                    url: url.url,
                    method: 'GET',
                    responseType: 'stream',
                });

                const PdfNameGet = response2.data.rawHeaders;

                const filenameSave = getFilenameFromHeaders(PdfNameGet);
                const fileNameSave = filenameSave || `pdf-file-${index + 1}.pdf`; // Use default filename if not found in headers
                const filePathNew = path.join(__dirname, dFolder, fileNameSave);

                const writerNew = fs.createWriteStream(filePathNew);
                response2.data.pipe(writerNew);

                return new Promise((resolve, reject) => {
                    writerNew.on('finish', () => {
                        pdfFiles.push({ name: fileNameSave, path: filePathNew });
                        resolve();
                    });
                    writerNew.on('error', reject);
                });
            });


            await Promise.all(downloadPromises).then(() => {
                console.log('Downloads Are success');
            })

            // Create zip file
            
            const zipFileName = `${file_name3}.zip`;
            const zipFilePath = path.join(__dirname, dFolder, zipFileName);
            const output = fs.createWriteStream(zipFilePath);
            const archive = archiver('zip', {
                zlib: { level: 9 } // Sets the compression level.
            });
            const token = generateToken();
            output.on('close', () => {
                fileMap.set(token, { path: zipFilePath, name: zipFileName });
                console.log(archive.pointer() + ' total bytes');
                console.log('archiver has been finalized and the output file descriptor has closed.');
                const downloadUrl = `http://localhost:${PORT}/download-zip/${token}`;
                pdfFiles.forEach(file => fs.unlinkSync(file.path));

                res.json({ message: 'PDF files downloaded and zipped successfully', downloadUrl });
            });

            archive.on('error', (err) => {
                throw err;
            });

            archive.pipe(output);

            pdfFiles.forEach(file => {
                archive.file(file.path, { name: file.name });
            });

            archive.finalize();
        }
    };

    // Function to extract filename from headers
    function getFilenameFromHeaders(headers) {
        let contentDisposition = headers[13];
        if (contentDisposition) {
            let startIndex = contentDisposition.indexOf('filename="');
            if (startIndex !== -1) {
                let filename = contentDisposition.substring(startIndex + 10, contentDisposition.length - 1);
                return filename;
            }
        }
        return null;
    }

    // Function to generate a unique token
    function generateToken() {
        return Math.random().toString(36).substr(2, 30); // Example: generates an 8-character token
    }

};


// Endpoint to handle zip file download


module.exports = { pdfZipDownload, fileMap }