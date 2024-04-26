/*
    chunked-image-tester: client side javascript
*/

function addImageToDocument(url) {
    console.log(`addImageToDocument url=${url}`);
    var img = document.createElement("img");
    img.src = url;
    img.width = 1024;
    document.body.appendChild(img);
}

async function requestImageFull(imagePath) {
    console.log(`requestImageFull image=${imagePath}`);
    try {
        const response = await fetch(imagePath, {
            headers: {
                "Cache-Control": "max-age=31536000",
            },
        });
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        addImageToDocument(imageUrl);
    } catch (error) {
        console.error("Failed to load image.", error);
    }
}

async function requestImageHeaders(imagePath) {
    console.log(`requestImageHeaders image=${imagePath}`);
    const response = await fetch(imagePath, {
        method: "HEAD",
        headers: {
            "Cache-Control": "max-age=31536000",
        },
    });
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }
    return response.headers;
}

async function requestImageChunk(imagePath, start, end) {
    const rangeRequested = `bytes=${start}-${end}`;
    console.log(`Requesting chunk @ ${rangeRequested}`);
    const response = await fetch(imagePath, {
        headers: {
            Range: rangeRequested,
            "Cache-Control": "max-age=31536000",
        },
    });
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }
    return response;
}

async function requestImageInSerialChunks(imagePath, maxChunkSize) {
    console.log(`requestImageInSerialChunks image=${imagePath} maxChunkSize=${maxChunkSize}`);
    try {
        // request the size of the image
        const imageHeaders = await requestImageHeaders(imagePath);
        const totalSize = imageHeaders.get("Content-Length");
        if (!totalSize) {
            throw new Error("Response missing Content-Length header");
        }

        // request the image in chunks
        const chunksRequired = Math.ceil(totalSize / maxChunkSize);
        const chunks = [];
        console.log(
            `Starting to request image: totalSize=${totalSize} chunksRequired=${chunksRequired}`
        );
        for (let start = 0; start < totalSize; start += maxChunkSize) {
            // request the next chunk
            const end = Math.min(start + maxChunkSize, totalSize) - 1;
            const response = await requestImageChunk(imagePath, start, end);

            // handle received chunk
            const chunk = await response.arrayBuffer();
            console.log(
                `Received chunk @ ${response.headers.get("Content-Range")}`
            );
            chunks.push(chunk);
        }

        // create the image
        var contentType = imageHeaders.get("Content-Type");
        console.log(
            `Creating the image. contentType=${contentType} contentLength=${totalSize}`
        );
        var blob = new Blob(chunks, { type: contentType });
        addImageToDocument(URL.createObjectURL(blob));
    } catch (error) {
        console.error("Failed to load image.", error);
    }
}

async function requestImageInParallelChunks(imagePath, maxChunkSize) {
    console.log(`requestImageInParallelChunks image=${imagePath} maxChunkSize=${maxChunkSize}`);
    try {
        // request the size of the image
        const imageHeaders = await requestImageHeaders(imagePath);
        const totalSize = imageHeaders.get("Content-Length");
        if (!totalSize) {
            throw new Error("Response missing Content-Length header");
        }

        // request the image in chunks
        const chunksRequired = Math.ceil(totalSize / maxChunkSize);
        const chunks = new Map();
        const chunkPromises = [];
        console.log(
            `Starting to request image: totalSize=${totalSize} chunksRequired=${chunksRequired}`
        );
        for (let start = 0; start < totalSize; start += maxChunkSize) {
            const end = Math.min(start + maxChunkSize, totalSize) - 1;
            chunkPromises.push(
                requestImageChunk(imagePath, start, end)
                    .then((response) => {
                        return response.arrayBuffer();
                    })
                    .then((chunk) => {
                        console.log(`Received chunk @ ${start}`);
                        chunks.set(start, chunk);
                    })
            );
        }

        // wait for all chunks to be received
        await Promise.all(chunkPromises).catch((error) => {
            throw error;
        });

        // create the image
        var contentType = imageHeaders.get("Content-Type");
        console.log(
            `Creating the image. contentType=${contentType} contentLength=${totalSize}`
        );
        var sortedChunks = Array.from(chunks.entries())
            .sort((a, b) => a[0] - b[0])
            .map((entry) => entry[1]);
        var blob = new Blob(sortedChunks, { type: contentType });
        addImageToDocument(URL.createObjectURL(blob));
    } catch (error) {
        console.error("Failed to load image.", error);
    }
}

async function requestImage(imagePath, downloadType, maxChunkSizeMB) {
    const maxChunkSizeBytes = Number(maxChunkSizeMB) * 1024 * 1024;
    switch (downloadType) {
        case "full":
            await requestImageFull(imagePath);
            break;
        case "serial_chunks":
            await requestImageInSerialChunks(imagePath, maxChunkSizeBytes);
            break;
        case "parallel_chunks":
            await requestImageInParallelChunks(imagePath, maxChunkSizeBytes);
            break;
        default:
            console.error("Unknown download type:", downloadType);
    }
}