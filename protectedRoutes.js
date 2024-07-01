// protectedRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
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
const { logError } = require('./logger');
const { downLoadndEncryptPdf} = require('./singlePdf');
const {downLoadndMultyEncryptPdf} = require('./multyPdf');

app.use(cors());

app.use(bodyParser.json());

const secretKey = 'ft#56Gr@dh&60!tg%$53';

const authenticateToken = (tokens) => (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const ipAddress = req.ipAddress;

    if (!token) {
        return res.status(401).json({ message: 'Token not provided' });
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token not valid' });
        }
        const storedTokenInfo = tokens[user.email];
        if (!storedTokenInfo || storedTokenInfo.token !== token || storedTokenInfo.ipAddress !== ipAddress) {
            return res.status(403).json({ message: 'Token not valid' });
        }

        req.user = user;
        next();
    });
};

module.exports = (tokens) => {
    const router = express.Router();

    router.post('/', authenticateToken(tokens), (req, res) => {
        const { pdfUrl, user_email, product_id, licensed_number, customer_name, purchase_date } = req.body;

        if (!pdfUrl || !user_email || !product_id || !licensed_number || !customer_name || !purchase_date) {
            return res.status(400).json({ error: "Data is missing" });
        } else if (req.user.email !== user_email) {
            return res.status(400).json({ error: "Email does not match the entered token please check the email ID or token" });
        }
        else if (!pdfUrl) {
            return res.status(400).json({ error: 'No URLs provided' });
        }

        const urlArray = pdfUrl.split(',').map(url => url.trim());

        if (urlArray.length === 1) {
            downLoadndEncryptPdf(pdfUrl, user_email, product_id, licensed_number, customer_name, purchase_date, req, res, );
        } else {
            downLoadndMultyEncryptPdf(pdfUrl, user_email, product_id, licensed_number, customer_name, purchase_date, req, res);
        }

        

    });

    return router;
};

