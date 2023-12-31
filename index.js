const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const cors = require("cors");
const Api2Pdf = require('api2pdf');
const http = require("http");
const FormData = require('form-data');
const app = express();
const port = process.env.PORT || 5001;
const fs2 = require('fs').promises;
const { PDFDocument, rgb } = require('pdf-lib');
const url = require('url');


app.use(cors());

app.use(bodyParser.json());

app.post("/api/addPdfEncryption", async (req, res) => {
    const { pdfUrl, user_email, product_id, licensed_number, customer_name, purchase_date } = req.body;

    if (!pdfUrl || !user_email || !product_id || !licensed_number || !customer_name || !purchase_date) {
        return res.status(400).json({ error: "Data is missing" });
    }

    var file_name2 = `Order ${licensed_number} licensed to ${customer_name} on ${purchase_date}`;
    axios({
        method: 'get',
        url: pdfUrl,
        responseType: 'stream',
    })
        .then(response => {
            const destinationFolder = './downloads';
            const urlObject = new URL(pdfUrl);
            const Newfilename = path.basename(urlObject.pathname);

            const filePath = path.join(destinationFolder, Newfilename);

            const downloadedFileName = `Order_${licensed_number}_licensed_to_${customer_name}_on_${purchase_date}`;
            const createdFileName = `/downloads/${downloadedFileName}_Downloded.pdf`;
            const downloadPath = path.join(__dirname, createdFileName);
            const writerStream = fs.createWriteStream(downloadPath);
            response.data.pipe(writerStream);

            writerStream.on('close', () => {
                console.log(`PDF downloaded successfully to: ${downloadPath}`);
                const watermarkText = file_name2;
                addWatermark(downloadPath, downloadedFileName, watermarkText,)
                    .then((response) => {
                        console.log('PDF downloaded successfully');
                        const serverPath = `watermark/${downloadedFileName}_watermark.pdf`;
                        const apiUrl = 'https://v2.convertapi.com/convert/pdf/to/encrypt?Secret=Ltp5jY5XAyFl5okz';
                        const base64FileContent = fs.readFileSync(serverPath, 'base64');
                        const requestData = {
                            Parameters: [
                                {
                                    Name: 'File',
                                    FileValue: {
                                        Name: downloadedFileName + ".pdf",
                                        Data: base64FileContent,
                                    },
                                },
                                {
                                    Name: 'OwnerPassword',
                                    Value: user_email,
                                },
                                {
                                    Name: 'UserPassword',
                                    Value: user_email,
                                },
                            ],
                        };

                        axios.post(apiUrl, requestData, {
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        })
                            .then(response => {
                                console.log('Response:', response.data.Files);
                                const apiResponse = response.data;
                                const file = apiResponse.Files[0];;
                                const fileName = file.FileName;
                                const fileData = file.FileData;
                                const binaryData = Buffer.from(fileData, 'base64');
                                fs.writeFile(`final/${fileName}`, binaryData, (err) => {
                                    if (err) {
                                        console.error(`Error saving file "${fileName}":`, err);
                                    } else {
                                        console.log(`File "${fileName}" has been saved.`);
                                        var file_name = `Order_${licensed_number}_licensed_to_${customer_name}_on_${purchase_date}`;
                                        var folder = 'final';
                                        var fullPath = folder + '/' + file_name + '.pdf';

                                        delay(500);
                                        //start api 2 callback --------------------------------
                                        setTimeout(() => {
                                            const data = new FormData();
                                            data.append("file", fs.createReadStream(fullPath))
                                            data.append("new_permissions_password", "718261649")
                                            data.append("restrictions[]", "print_low")
                                            data.append("restrictions[]", "print_high")
                                            data.append("restrictions[]", "edit_document_assembly")
                                            data.append("restrictions[]", "edit_fill_and_sign_form_fields")
                                            data.append("restrictions[]", "edit_annotations")
                                            data.append("restrictions[]", "edit_content")
                                            data.append("restrictions[]", "copy_content")
                                            data.append("restrictions[]", "accessibility_off")
                                            data.append("current_open_password", user_email)
                                            data.append("output", Newfilename)
                                            const config = {
                                                method: 'post',
                                                maxBodyLength: Infinity,
                                                url: 'https://api.pdfrest.com/restricted-pdf',
                                                headers: {
                                                    'Api-Key': 'f730e952-700f-4cc1-b7f7-a6e142d462b7',
                                                    ...data.getHeaders()
                                                },
                                                data: data
                                            };

                                            axios(config)
                                                .then(function (response) {
                                                    console.log(JSON.stringify(response.data));
                                                    const responseData = {
                                                        download: "This is your API response data.",
                                                    };

                                                    res.json(response.data);
                                                })
                                                .catch(function (error) {
                                                    console.log(error);
                                                });
                                        }, 100)
                                    }
                                });
                            })
                            .catch(error => {
                                console.error('Error:', error.response ? error.response.data : error.message);
                            });
                    })
            });
        })
        .catch(error => {
            console.error('Error downloading PDF:', error.message);
        });

});

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function addWatermark(downloadPath, downloadedFileName, watermarkText) {
    try {
        const pdfBytes = await fs2.readFile(downloadPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        const pages = pdfDoc.getPages();
        for (const page of pages) {
            const { width, height } = page.getSize();
            const watermarkTextSize = 10;

            // const x = width / 2 - (watermarkText.length * watermarkTextSize / 4); 
            // const y = 9;

            page.drawText(watermarkText, {
                x: 50,
                y: 13,
                size: watermarkTextSize,
                color: rgb(0, 0, 0),
            });
        }
        const modifiedPdfBytes = await pdfDoc.save();
        const outputPath = `watermark/${downloadedFileName}_watermark.pdf`;
        const serverPath = `watermark/${downloadedFileName}_watermark.pdf`;
        await fs2.writeFile(outputPath, modifiedPdfBytes);
        console.log(outputPath);
        app.get(serverPath, (req, res) => {
            const watermarkFilePath = path.join(__dirname, serverPath);
            fs.readFile(watermarkFilePath, (err, data) => {
                if (err) {
                    res.status(404).send("404 Not Found");
                } else {
                    res.contentType("application/pdf");
                    res.send(data);
                }
            });
        });

        console.log('Watermark added successfully!');
    } catch (error) {
        console.error('Error adding watermark:', error);
    }
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
