importScripts('https://cdn.jsdelivr.net/npm/utif@2.0.1/UTIF.js');

self.onmessage = function(e) {
    const arrayBuffer = e.data;
    const MAX_DIMENSION = 800; // max dimension for preview (width or height)

    try {
        const ifds = UTIF.decode(arrayBuffer);
        UTIF.decodeImages(arrayBuffer, ifds);
        const width = ifds[0].width;
        const height = ifds[0].height;

        // Decode full RGBA
        const fullRGBA = UTIF.toRGBA8(ifds[0]);

        // Determine scale factor (if image exceeds max dimension)
        let scale = 1;
        if (width > height && width > MAX_DIMENSION) scale = MAX_DIMENSION / width;
        else if (height >= width && height > MAX_DIMENSION) scale = MAX_DIMENSION / height;

        // If scaling needed, downscale the image data
        if (scale < 1) {
            const newWidth = Math.round(width * scale);
            const newHeight = Math.round(height * scale);

            // Create temp canvas
            const offscreenCanvas = new OffscreenCanvas(width, height);
            const ctx = offscreenCanvas.getContext('2d');

            // Create ImageData from fullRGBA
            const fullImageData = new ImageData(new Uint8ClampedArray(fullRGBA), width, height);
            ctx.putImageData(fullImageData, 0, 0);

            // Create another canvas for the resized image
            const resizeCanvas = new OffscreenCanvas(newWidth, newHeight);
            const resizeCtx = resizeCanvas.getContext('2d');

            // Draw scaled image
            resizeCtx.drawImage(offscreenCanvas, 0, 0, newWidth, newHeight);

            // Extract resized image data back
            const resizedImageData = resizeCtx.getImageData(0, 0, newWidth, newHeight);

            // Send resized RGBA buffer and dims back
            self.postMessage({
                rgba: resizedImageData.data.buffer,
                width: newWidth,
                height: newHeight
            }, [resizedImageData.data.buffer]);

        } else {
            // No scaling needed, send full image directly
            self.postMessage({
                rgba: fullRGBA.buffer,
                width: width,
                height: height
            }, [fullRGBA.buffer]);
        }
    } catch (err) {
        self.postMessage({error: err.message});
    }
};
