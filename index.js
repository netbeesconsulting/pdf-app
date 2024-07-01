// server.js
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const protectedRoutes = require('./protectedRoutes');
const path = require('path');
const app = express();
const fs = require('fs');
const port = process.env.PORT || 5001;
const {fileMap} = require('./pdfZip');
const secretKey = 'ft#56Gr@dh&60!tg%$53';

const tokens = {};

const extractIp = (req, res, next) => {
    req.ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    next();
};

app.use(bodyParser.json());
app.use(extractIp);

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

app.post('/api/generate-token', (req, res) => {
    const { email } = req.body;
    const ipAddress = req.ipAddress;

    if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    const token = jwt.sign({ email, ipAddress }, secretKey, { expiresIn: '24h' });

    tokens[email] = { token, ipAddress };

    res.json({ token });
});

app.use('/api/addPdfEncryption', protectedRoutes(tokens));

app.get('/download-zip/:token', (req, res) => {
    const { token } = req.params;
    const fileDetails = fileMap.get(token);

    if (fileDetails && fs.existsSync(fileDetails.path)) {
        res.download(fileDetails.path, fileDetails.name, (err) => {
            if (err) {
                console.error('Error sending zip file:', err);
                res.status(500).json({ error: 'Failed to download zip file' });
            } else {
                fs.unlinkSync(fileDetails.path);
                fileMap.delete(token);
            }
        });
    } else {
        res.status(404).json({ error: 'Zip file not found' });
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
