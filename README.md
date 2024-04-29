# README

This app is a simple node+express server and single page app to demonstrate browser caching of partial content responses.

## Running

This will install and start the app at port 8085 on localhost.

```js
    npm install
    npm run start
```

### Chrome

1. Install and launch the node server in the attached zip.
2. Open browser and navigate to http://localhost:8085 served by the node app.
3. Clear the site cache
4. Open the Developer Tools and switch to the Network tab.
5. Confirm that "disable cache" is NOT selected.
6. Select the "Bad" image and "Serial" as the download type.
7. Click "Load Image". This should append an image to the document.
8. In the Network panel, observe that 4 chunks are requested and none of them are cached (as expected).
9. Click "Load Image" again.  This should append another copy of this image to the document.
10. In the Network panel, observe that 4 chunks are requested and again none of them are cached (not expected).
11. Now select the "Good" image and "Serial" as the download type.
12. Click "Load Image". This should append a different image to the document.
13. In the Network panel, observe that 4 chunks are requested and none of them are cached (as expected).
14. Click "Load Image" again.  This should append another copy of the new image to the document.
15. In the Network panel, observe that 4 chunks are requested but this time all of the chunks are served from the cache (as expected).

The primary difference between these two images is the size. The bad image is **34.6MB** and the good image is **33.3MB**.

### Firefox

1. Install and launch the node server in the attached zip.
2. Open browser and navigate to http://localhost:8085 served by the node app.
3. Clear the site cache
4. Open the Web Developer Tools and switch to the Network tab.
5. Confirm that "disable cache" is NOT selected.
6. Select on of the images and "Serial" as the download type.
7. Click "Load Image". This should append an image to the document.
8. In the Network panel, observe that 4 chunks are requested and none of them are cached (as expected).
9. Click "Load Image" again.  This should append another copy of this image to the document.
10. In the Network panel, observe that 4 chunks are requested and again none of them are cached (not expected).

In this case none of the image chunks are cached.
