#!/usr/bin/env node

/*
 ** chunked-image-tester
 ** This is a simple Express server that serves a single page application with a single image.
 */

const express = require("express");
const path = require("path");
const app = express();
const crypto = require('crypto');
const fs = require("fs");

function cleanExit() {
    console.log("Caught interrupt signal, shutting down gracefully...");
    process.exit();
}

process.on("SIGINT", cleanExit);
process.on("SIGTERM", cleanExit);

const eTagMap = new Map();

function getETag(filePath) {
    if (eTagMap.has(filePath)) {
        return eTagMap.get(filePath);
    }
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha1');
    hashSum.update(fileBuffer);
    const hex = hashSum.digest('hex');
    eTagMap.set(filePath, `"${hex}"`);
    return hex;
}

/*
 ** GET scripts
 */
app.get("/scripts/:scriptFile", function (req, res) {
    console.log(`Requested scripts/${req.params.scriptFile}`);
    res.sendFile(
        path.join(__dirname, "../public/scripts", req.params.scriptFile)
    );
});

/*
 ** HEAD image - deliver just the headers for an image
 */
app.head("/images/:imageName", function (req, res) {

    // find the image requested
    const imageName = req.params.imageName;
    console.log(`Requested headers for public/images/${imageName}`);
    const contentType = getMimeType(imageName);
    const filePath = path.join(__dirname, "../public/images", imageName);
    const stats = fs.statSync(filePath);
    const eTag = getETag(filePath);

    // send the headers
    res.set('Accept-Ranges', 'bytes');
    res.set('Cache-Control', 'max-age=31536000');
    res.set("Content-Length", stats.size.toString());
    res.set("Content-Type", contentType);
    res.set('ETag', eTag);
    res.set("Last-Modified", stats.mtime.toUTCString());

    // check if the client already has the latest version
    const clientETag = req.headers["if-none-match"];
    if (clientETag && clientETag === eTag) {
        res.status(304);
    } else {
        res.status(200);
    }

    // send the response
    res.end();
});

/*
 ** GET image - delivers images as immediate or partial content responses
 */
app.get("/images/:imageName", function (req, res) {

    // find the image to send
    const imageName = req.params.imageName;
    const contentType = getMimeType(imageName);
    const filePath = path.join(__dirname, "../public/images", imageName);
    const stats = fs.statSync(filePath);
    const eTag = getETag(filePath);

    // set the common headers
    res.set('Accept-Ranges', 'bytes');
    res.set('Cache-Control', 'max-age=31536000');
    res.set('Content-Length', stats.size.toString());
    res.set('Content-Type', contentType);
    res.set('ETag', eTag);
    res.set('Last-Modified', stats.mtime.toUTCString());

    // check if the client already has the latest version
    const clientETag = req.headers["if-none-match"] || req.headers["If-None-Match"];
    if (clientETag && clientETag === eTag) {
        console.log(`Requested public/images/${imageName} but client has latest version`);
        res.status(304);
        res.end();
        return;
    }

    // figure out whether to send the image in chunks or all at once
    const range = req.headers.range;
    if (range) {
        console.log(`Requested partial response ${range} for public/images/${imageName}`);

        // parse the requested range
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parseInt(parts[1], 10);

        // create a read stream from start to end and pipe it to the response
        const readStream = fs.createReadStream(filePath, { start, end });
        readStream.pipe(res);

        // set the headers for a partial content response
        res.set('Content-Length', (end - start + 1).toString());
        res.set('Content-Range', `bytes ${start}-${end}/${stats.size}`);
        res.status(206);

    } else {
        console.log(`Requested complete response for public/images/${imageName}`);
        res.sendFile(filePath);
    }
});

/*
 ** GET home page
 */
app.get("/", function (req, res) {
    console.log(`Requested home page`);
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

function getMimeType(imageName) {
    const extension = imageName.split(".").pop();
    switch (extension) {
        case "jpg":
        case "jpeg":
            return "image/jpeg";
        case "png":
            return "image/png";
        case "gif":
            return "image/gif";
        case "tiff":
            return "image/tiff";
        case "heic":
            return "image/heic";
    }
    return "application/octet-stream";
}

const PORT = process.env.PORT || 8085;

app.listen(PORT, () => {
    console.log(`chunked-image-tester service is running on port ${PORT}`);
});
