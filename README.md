# README

This app is a simple node+express server and single page app to demonstrate browser caching of partial content responses.

## Running

This will install and start the app at port 8085 on localhost.

```js
    npm install
    npm run start
```

1. Install and launch the node server in the attached zip.
2. Open browser and navigate to http://localhost:8085 served by the node app.
3. Open the Developer Tools and switch to the Network tab.
4. Select the "Bad" image and "Serial" as the download type.
5. Click "Load Image". This should append an image to the document.
6. In the Network panel, observe that 4 chunks are requested and none of them are cached (as expected).
7. Click "Load Image" again.  This should append another copy of this image to the document.
8. In the Network panel, observe that 4 chunks are requested and again none of them are cached (not expected).
9.  Now select the "Good" image and "Serial" as the download type.
10. Click "Load Image". This should append a different image to the document.
11. In the Network panel, observe that 4 chunks are requested and none of them are cached (as expected).
12. Click "Load Image" again.  This should append another copy of the new image to the document.
13. In the Network panel, observe that 4 chunks are requested but this time all of the chunks are served from the cache (as expected).

The primary difference between these two images is the size. The bad image is **34.6MB** and the good image is **33.3MB**.
