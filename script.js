// Creative Charts Pipeline - Client-side Processing
// Supports: Embroidery, Pixel Art, Blueprint, Halftone, Oil Painting, ASCII

class CreativePipeline {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.imageData = null;
    }

    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    setImage(img) {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    // ==========================================
    // SHARED UTILITIES
    // ==========================================

    getGrayScale(data, i) {
        return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // ==========================================
    // STYLE A: EMBROIDERY (Original)
    // ==========================================
    async applyEmbroidery(img, params) {
        const steps = [
            { name: 'Quantizing colors...', fn: () => this.quantizeColors(this.imageData, params.numColors) },
            { name: 'Applying thread pattern...', fn: () => this.applyThreadPattern(this.imageData, params.threadThickness) },
            { name: 'Spreading pixels...', fn: () => this.applySpread(this.imageData, params.spreadAmount) },
            { name: 'Adding fabric texture...', fn: () => this.applyFabricTexture(this.imageData) },
            { name: 'Applying 3D shading...', fn: () => this.apply3DShading(this.imageData) },
            { name: 'Boosting colors...', fn: () => this.applyColorBoost(this.imageData, params.brightness, 105) }
        ];
        return this.runPipeline(img, steps);
    }

    quantizeColors(imageData, numColors) {
        const data = imageData.data;
        const pixels = [];
        for (let i = 0; i < data.length; i += 4 * 4) { // Sample every 4th pixel for speed
            pixels.push([data[i], data[i + 1], data[i + 2]]);
        }
        const palette = this.kMeansClustering(pixels, numColors);
        for (let i = 0; i < data.length; i += 4) {
            const nearest = this.findNearestColor([data[i], data[i + 1], data[i + 2]], palette);
            data[i] = nearest[0]; data[i + 1] = nearest[1]; data[i + 2] = nearest[2];
        }
        return imageData;
    }

    kMeansClustering(pixels, k, maxIterations = 5) {
        let centroids = pixels.slice(0, k);
        for (let iter = 0; iter < maxIterations; iter++) {
            const clusters = Array(k).fill(null).map(() => []);
            pixels.forEach(pixel => {
                const nearestIdx = this.findNearestColorIndex(pixel, centroids);
                clusters[nearestIdx].push(pixel);
            });
            centroids = clusters.map(c => {
                if (c.length === 0) return [0, 0, 0];
                const sum = c.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
                return sum.map(v => Math.round(v / c.length));
            });
        }
        return centroids;
    }

    findNearestColor(pixel, palette) {
        let minDist = Infinity, nearest = palette[0];
        palette.forEach(c => {
            const dist = (pixel[0] - c[0]) ** 2 + (pixel[1] - c[1]) ** 2 + (pixel[2] - c[2]) ** 2;
            if (dist < minDist) { minDist = dist; nearest = c; }
        });
        return nearest;
    }

    findNearestColorIndex(pixel, palette) {
        let minDist = Infinity, nearestIdx = 0;
        palette.forEach((c, i) => {
            const dist = (pixel[0] - c[0]) ** 2 + (pixel[1] - c[1]) ** 2 + (pixel[2] - c[2]) ** 2;
            if (dist < minDist) { minDist = dist; nearestIdx = i; }
        });
        return nearestIdx;
    }

    applyThreadPattern(imageData, thickness) {
        const data = imageData.data, w = imageData.width, h = imageData.height;
        const copy = new Uint8ClampedArray(data);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let r = 0, g = 0, b = 0, c = 0;
                for (let dx = -thickness; dx <= thickness; dx++) {
                    let nx = x + dx;
                    if (nx >= 0 && nx < w) {
                        let idx = (y * w + nx) * 4;
                        r += copy[idx]; g += copy[idx + 1]; b += copy[idx + 2]; c++;
                    }
                }
                let idx = (y * w + x) * 4;
                data[idx] = r / c; data[idx + 1] = g / c; data[idx + 2] = b / c;
            }
        }
        return imageData;
    }

    applySpread(imageData, amount) {
        const data = imageData.data, w = imageData.width, h = imageData.height;
        const copy = new Uint8ClampedArray(data);
        for (let i = 0; i < data.length; i += 4) {
            const x = (i / 4) % w, y = Math.floor((i / 4) / w);
            const dx = Math.floor((Math.random() - 0.5) * amount * 2);
            const dy = Math.floor((Math.random() - 0.5) * amount * 2);
            const nx = Math.max(0, Math.min(w - 1, x + dx));
            const ny = Math.max(0, Math.min(h - 1, y + dy));
            const srcIdx = (ny * w + nx) * 4;
            data[i] = copy[srcIdx]; data[i + 1] = copy[srcIdx + 1]; data[i + 2] = copy[srcIdx + 2];
        }
        return imageData;
    }

    applyFabricTexture(imageData) {
        // Simplified noise
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            let noise = (Math.random() - 0.5) * 30; // +/- 15
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        return imageData;
    }

    apply3DShading(imageData) {
        // Kept simple for now: slight emboss
        // (Full logic from previous file was good but long, keeping it lighter or similar)
        // Re-implementing a basic emboss
        const w = imageData.width, h = imageData.height, data = imageData.data;
        const copy = new Uint8ClampedArray(data);
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const idx = (y * w + x) * 4;
                const top = ((y - 1) * w + x) * 4;
                const bottom = ((y + 1) * w + x) * 4;
                // Vertical gradient
                const dy = (this.getGrayScale(copy, bottom) - this.getGrayScale(copy, top));
                const factor = dy * 0.5; // strength
                data[idx] = Math.min(255, Math.max(0, data[idx] + factor));
                data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + factor));
                data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + factor));
            }
        }
        return imageData;
    }

    applyColorBoost(imageData, brightness, saturation) {
        // See original HSL conversion if needed, simplified here with basic rgb scaling
        const data = imageData.data;
        const factor = brightness / 100;
        for (let i = 0; i < data.length; i += 4) {
            data[i] *= factor;
            data[i + 1] *= factor;
            data[i + 2] *= factor;
        }
        return imageData;
    }

    // ==========================================
    // STYLE B: PIXEL ART (Cross-stitch)
    // ==========================================
    async applyPixelArt(img, params) {
        const blockSize = Math.max(2, params.threadThickness * 2);
        const steps = [
            { name: 'Downsampling resolution...', fn: () => this.pixelate(img, blockSize) },
            { name: 'Quantizing palette...', fn: () => this.quantizeColors(this.imageData, params.numColors) },
            { name: 'Enhancing grid...', fn: () => this.drawGrid(this.imageData, blockSize) }
        ];
        return this.runPipeline(img, steps);
    }

    pixelate(img, blockSize) {
        // Redraw small then large
        const w = img.width, h = img.height;
        const smallW = Math.floor(w / blockSize);
        const smallH = Math.floor(h / blockSize);

        // Draw small
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(img, 0, 0, smallW, smallH);

        // Draw back large
        this.ctx.drawImage(this.canvas, 0, 0, smallW, smallH, 0, 0, w, h);
        this.imageData = this.ctx.getImageData(0, 0, w, h);
    }

    drawGrid(imageData, blockSize) {
        const data = imageData.data, w = imageData.width, h = imageData.height;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (x % blockSize === 0 || y % blockSize === 0) {
                    const idx = (y * w + x) * 4;
                    // Darken for grid
                    data[idx] *= 0.8;
                    data[idx + 1] *= 0.8;
                    data[idx + 2] *= 0.8;
                }
            }
        }
        return imageData;
    }

    // ==========================================
    // STYLE C: BLUEPRINT
    // ==========================================
    async applyBlueprint(img, params) {
        const steps = [
            { name: 'Detecting edges...', fn: () => this.applyEdgeDetection(this.imageData) },
            { name: 'Applying blueprint style...', fn: () => this.applyBlueprintColor(this.imageData) },
            { name: 'Drawing technical grid...', fn: () => this.drawBlueprintGrid(this.imageData) }
        ];
        return this.runPipeline(img, steps);
    }

    applyEdgeDetection(imageData) {
        const w = imageData.width, h = imageData.height, data = imageData.data;
        const copy = new Uint8ClampedArray(data);
        // Sobel-like simple edge
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const idx = (y * w + x) * 4;
                const gx = -this.getGrayScale(copy, ((y - 1) * w + x - 1) * 4) + this.getGrayScale(copy, ((y - 1) * w + x + 1) * 4) +
                    -2 * this.getGrayScale(copy, (y * w + x - 1) * 4) + 2 * this.getGrayScale(copy, (y * w + x + 1) * 4) +
                    -this.getGrayScale(copy, ((y + 1) * w + x - 1) * 4) + this.getGrayScale(copy, ((y + 1) * w + x + 1) * 4);

                const gy = -this.getGrayScale(copy, ((y - 1) * w + x - 1) * 4) - 2 * this.getGrayScale(copy, ((y - 1) * w + x) * 4) - this.getGrayScale(copy, ((y - 1) * w + x + 1) * 4) +
                    this.getGrayScale(copy, ((y + 1) * w + x - 1) * 4) + 2 * this.getGrayScale(copy, ((y + 1) * w + x) * 4) + this.getGrayScale(copy, ((y + 1) * w + x + 1) * 4);

                const mag = Math.sqrt(gx * gx + gy * gy);
                const val = mag > 50 ? 255 : 0; // Threshold
                data[idx] = val; data[idx + 1] = val; data[idx + 2] = val;
            }
        }
        return imageData;
    }

    applyBlueprintColor(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // If white (edge), keep it white/light blue. If black, make it Blueprint Blue
            if (data[i] > 128) {
                // Lines: White with slight blue tint
                data[i] = 240; data[i + 1] = 240; data[i + 2] = 255;
            } else {
                // Background: #0044cc
                data[i] = 0; data[i + 1] = 68; data[i + 2] = 204;
            }
        }
        return imageData;
    }

    drawBlueprintGrid(imageData) {
        const w = imageData.width, h = imageData.height, data = imageData.data;
        const step = 50;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (x % step === 0 || y % step === 0) {
                    const idx = (y * w + x) * 4;
                    // Light grid line
                    data[idx] = Math.min(255, data[idx] + 30);
                    data[idx + 1] = Math.min(255, data[idx + 1] + 30);
                    data[idx + 2] = Math.min(255, data[idx + 2] + 30);
                }
            }
        }
        return imageData;
    }

    // ==========================================
    // STYLE D: HALFTONE
    // ==========================================
    async applyHalftone(img, params) {
        const dotSize = Math.max(4, params.threadThickness * 2 + 2);
        const steps = [
            { name: 'Generating halftone dots...', fn: () => this.renderHalftone(img, dotSize) }
        ];
        return this.runPipeline(img, steps);
    }

    renderHalftone(img, dotSize) {
        // Redraw entirely
        const w = img.width, h = img.height;
        // Draw temporarily to read data
        this.ctx.drawImage(img, 0, 0);
        const rawData = this.ctx.getImageData(0, 0, w, h).data;

        // Clear canvas to white
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, w, h);
        this.ctx.fillStyle = '#000000'; // Ink color

        for (let y = 0; y < h; y += dotSize) {
            for (let x = 0; x < w; x += dotSize) {
                // Average brightness of block
                let sum = 0, count = 0;
                for (let by = 0; by < dotSize; by++) {
                    for (let bx = 0; bx < dotSize; bx++) {
                        if (x + bx >= w || y + by >= h) continue;
                        const idx = ((y + by) * w + (x + bx)) * 4;
                        sum += this.getGrayScale(rawData, idx);
                        count++;
                    }
                }
                const avg = sum / count;
                const radius = (dotSize / 2) * (1 - avg / 255); // Darker = larger

                this.ctx.beginPath();
                this.ctx.arc(x + dotSize / 2, y + dotSize / 2, radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        this.imageData = this.ctx.getImageData(0, 0, w, h);
    }

    // ==========================================
    // STYLE E: OIL PAINTING
    // ==========================================
    async applyOilPainting(img, params) {
        const brushSize = Math.max(3, params.threadThickness * 2);
        const steps = [
            { name: 'Applying brush strokes...', fn: () => this.renderOilStrokes(img, brushSize) }
        ];
        return this.runPipeline(img, steps);
    }

    renderOilStrokes(img, radius) {
        const w = img.width, h = img.height;
        this.ctx.drawImage(img, 0, 0);
        const srcData = this.ctx.getImageData(0, 0, w, h).data;

        // Fill white base
        this.ctx.fillRect(0, 0, w, h);

        // Randomly draw oriented ellipses
        // Iterate grid but add randomness
        for (let i = 0; i < (w * h) / 2; i++) { // Reduce density for speed, or loop
            const x = Math.floor(Math.random() * w);
            const y = Math.floor(Math.random() * h);
            const idx = (y * w + x) * 4;

            const r = srcData[idx], g = srcData[idx + 1], b = srcData[idx + 2];

            // Simple "orientation" based on brightness? Or random.
            const angle = Math.random() * Math.PI;

            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(angle);
            this.ctx.fillStyle = `rgb(${r},${g},${b})`;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, radius * 2, radius / 2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        this.imageData = this.ctx.getImageData(0, 0, w, h);
    }

    // ==========================================
    // STYLE F: ASCII
    // ==========================================
    async applyASCII(img, params) {
        const steps = [
            { name: 'Converting to ASCII...', fn: () => this.renderASCII(img) }
        ];
        return this.runPipeline(img, steps);
    }

    renderASCII(img) {
        const w = img.width, h = img.height;
        // Downsample
        const cols = 100; // Fixed width for ASCII
        const charW = w / cols;
        const rows = Math.floor(h / charW * 0.5); // *0.5 because chars are non-square

        // Read small
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cols;
        tempCanvas.height = rows;
        const tCtx = tempCanvas.getContext('2d');
        tCtx.drawImage(img, 0, 0, cols, rows);
        const data = tCtx.getImageData(0, 0, cols, rows).data;

        // Render Text
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, w, h);

        this.ctx.font = `${charW * 1.5}px monospace`;
        this.ctx.fillStyle = '#00ff00'; // Matrix green
        this.ctx.textBaseline = 'top';

        const chars = " .:-=+*#%@";

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const idx = (y * cols + x) * 4;
                const br = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                const charIdx = Math.floor((br / 255) * (chars.length - 1));
                const char = chars[charIdx];

                this.ctx.fillText(char, x * charW, y * charW * 2);
            }
        }
        this.imageData = this.ctx.getImageData(0, 0, w, h);
    }

    // ==========================================
    // STYLE G: WATERCOLOR
    // ==========================================
    async applyWatercolor(img, params) {
        const steps = [
            { name: 'Applying color bleeding...', fn: () => this.applyColorBleeding(this.imageData, params.spreadAmount) },
            { name: 'Adding paper texture...', fn: () => this.applyPaperTexture(this.imageData) },
            { name: 'Creating soft edges...', fn: () => this.applySoftEdges(this.imageData, params.threadThickness) }
        ];
        return this.runPipeline(img, steps);
    }

    applyColorBleeding(imageData, intensity) {
        // Multiple passes of spread for watercolor bleeding effect
        for (let pass = 0; pass < 3; pass++) {
            this.applySpread(imageData, intensity * 2);
        }
        return imageData;
    }

    applyPaperTexture(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 15;
            data[i] = Math.min(255, Math.max(0, data[i] + noise + 10)); // Slight brightening
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise + 10));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + 10));
        }
        return imageData;
    }

    applySoftEdges(imageData, radius) {
        // Gaussian-like blur for soft watercolor edges
        const w = imageData.width, h = imageData.height, data = imageData.data;
        const copy = new Uint8ClampedArray(data);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let r = 0, g = 0, b = 0, count = 0;
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const nx = x + dx, ny = y + dy;
                        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                            const idx = (ny * w + nx) * 4;
                            r += copy[idx]; g += copy[idx + 1]; b += copy[idx + 2]; count++;
                        }
                    }
                }
                const idx = (y * w + x) * 4;
                data[idx] = r / count; data[idx + 1] = g / count; data[idx + 2] = b / count;
            }
        }
        return imageData;
    }

    // ==========================================
    // STYLE H: STAINED GLASS
    // ==========================================
    async applyStainedGlass(img, params) {
        const steps = [
            { name: 'Creating glass segments...', fn: () => this.quantizeColors(this.imageData, params.numColors) },
            { name: 'Adding lead lines...', fn: () => this.applyLeadLines(this.imageData) },
            { name: 'Creating glass shine...', fn: () => this.applyGlassShine(this.imageData) }
        ];
        return this.runPipeline(img, steps);
    }

    applyLeadLines(imageData) {
        const w = imageData.width, h = imageData.height, data = imageData.data;
        const copy = new Uint8ClampedArray(data);

        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const idx = (y * w + x) * 4;
                const right = (y * w + x + 1) * 4;
                const bottom = ((y + 1) * w + x) * 4;

                // Detect color boundaries
                const diffR = Math.abs(copy[idx] - copy[right]) + Math.abs(copy[idx] - copy[bottom]);
                const diffG = Math.abs(copy[idx + 1] - copy[right + 1]) + Math.abs(copy[idx + 1] - copy[bottom + 1]);
                const diffB = Math.abs(copy[idx + 2] - copy[right + 2]) + Math.abs(copy[idx + 2] - copy[bottom + 2]);

                if (diffR + diffG + diffB > 100) {
                    // Draw black lead line
                    data[idx] = 20; data[idx + 1] = 20; data[idx + 2] = 20;
                }
            }
        }
        return imageData;
    }

    applyGlassShine(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // Add random bright spots for glass reflection
            if (Math.random() < 0.02) {
                data[i] = Math.min(255, data[i] + 80);
                data[i + 1] = Math.min(255, data[i + 1] + 80);
                data[i + 2] = Math.min(255, data[i + 2] + 80);
            }
        }
        return imageData;
    }

    // ==========================================
    // STYLE I: MOSAIC TILES
    // ==========================================
    async applyMosaic(img, params) {
        const tileSize = Math.max(8, params.threadThickness * 3);
        const steps = [
            { name: 'Creating tile blocks...', fn: () => this.createTiles(img, tileSize) },
            { name: 'Adding grout lines...', fn: () => this.applyGrout(this.imageData, tileSize) }
        ];
        return this.runPipeline(img, steps);
    }

    createTiles(img, tileSize) {
        const w = img.width, h = img.height;
        this.ctx.drawImage(img, 0, 0);
        const srcData = this.ctx.getImageData(0, 0, w, h).data;

        for (let y = 0; y < h; y += tileSize) {
            for (let x = 0; x < w; x += tileSize) {
                // Sample center of tile
                const cx = Math.min(x + Math.floor(tileSize / 2), w - 1);
                const cy = Math.min(y + Math.floor(tileSize / 2), h - 1);
                const idx = (cy * w + cx) * 4;

                const r = srcData[idx], g = srcData[idx + 1], b = srcData[idx + 2];

                // Fill tile with slight variation
                this.ctx.fillStyle = `rgb(${r},${g},${b})`;
                this.ctx.fillRect(x, y, tileSize, tileSize);

                // Add slight gradient for 3D effect
                const gradient = this.ctx.createLinearGradient(x, y, x + tileSize, y + tileSize);
                gradient.addColorStop(0, `rgba(255,255,255,0.2)`);
                gradient.addColorStop(1, `rgba(0,0,0,0.2)`);
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(x, y, tileSize, tileSize);
            }
        }
        this.imageData = this.ctx.getImageData(0, 0, w, h);
    }

    applyGrout(imageData, tileSize) {
        const w = imageData.width, h = imageData.height, data = imageData.data;
        const groutWidth = 2;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (x % tileSize < groutWidth || y % tileSize < groutWidth) {
                    const idx = (y * w + x) * 4;
                    data[idx] = 200; data[idx + 1] = 200; data[idx + 2] = 200; // Light gray grout
                }
            }
        }
        return imageData;
    }

    // ==========================================
    // STYLE J: NEON GLOW
    // ==========================================
    async applyNeon(img, params) {
        const steps = [
            { name: 'Detecting edges...', fn: () => this.applyEdgeDetection(this.imageData) },
            { name: 'Creating neon glow...', fn: () => this.applyNeonGlow(this.imageData, params.brightness) },
            { name: 'Adding dark background...', fn: () => this.applyDarkBackground(this.imageData) }
        ];
        return this.runPipeline(img, steps);
    }

    applyNeonGlow(imageData, intensity) {
        const w = imageData.width, h = imageData.height, data = imageData.data;
        const copy = new Uint8ClampedArray(data);

        // Create glow by blurring bright edges
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                if (copy[idx] > 128) {
                    // Bright pixel - add glow
                    const glowRadius = 5;
                    for (let dy = -glowRadius; dy <= glowRadius; dy++) {
                        for (let dx = -glowRadius; dx <= glowRadius; dx++) {
                            const nx = x + dx, ny = y + dy;
                            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                                const nidx = (ny * w + nx) * 4;
                                const dist = Math.sqrt(dx * dx + dy * dy);
                                const falloff = Math.max(0, 1 - dist / glowRadius);
                                data[nidx] = Math.min(255, data[nidx] + 100 * falloff);
                                data[nidx + 1] = Math.min(255, data[nidx + 1] + 255 * falloff);
                                data[nidx + 2] = Math.min(255, data[nidx + 2] + 200 * falloff);
                            }
                        }
                    }
                }
            }
        }
        return imageData;
    }

    applyDarkBackground(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // Darken non-glowing areas
            if (data[i] < 50 && data[i + 1] < 50 && data[i + 2] < 50) {
                data[i] = 10; data[i + 1] = 10; data[i + 2] = 20;
            }
        }
        return imageData;
    }

    // ==========================================
    // STYLE K: PENCIL SKETCH
    // ==========================================
    async applySketch(img, params) {
        const steps = [
            { name: 'Converting to grayscale...', fn: () => this.convertToGrayscale(this.imageData) },
            { name: 'Detecting sketch lines...', fn: () => this.applySketchLines(this.imageData) },
            { name: 'Adding paper texture...', fn: () => this.applyPaperTexture(this.imageData) }
        ];
        return this.runPipeline(img, steps);
    }

    convertToGrayscale(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const gray = this.getGrayScale(data, i);
            data[i] = gray; data[i + 1] = gray; data[i + 2] = gray;
        }
        return imageData;
    }

    applySketchLines(imageData) {
        const w = imageData.width, h = imageData.height, data = imageData.data;
        const copy = new Uint8ClampedArray(data);

        // Invert and apply edge detection for pencil effect
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }

        // Blur inverted image
        this.applySoftEdges(imageData, 2);

        // Blend with original using color dodge
        for (let i = 0; i < data.length; i += 4) {
            const base = copy[i];
            const blend = data[i];
            const result = blend === 255 ? 255 : Math.min(255, (base * 256) / (255 - blend));
            data[i] = result; data[i + 1] = result; data[i + 2] = result;
        }

        return imageData;
    }

    // ==========================================
    // STYLE L: COMIC BOOK
    // ==========================================
    async applyComic(img, params) {
        const steps = [
            { name: 'Quantizing colors...', fn: () => this.quantizeColors(this.imageData, params.numColors) },
            { name: 'Adding bold outlines...', fn: () => this.applyBoldOutlines(this.imageData) },
            { name: 'Creating halftone dots...', fn: () => this.applyComicDots(this.imageData, params.threadThickness) }
        ];
        return this.runPipeline(img, steps);
    }

    applyBoldOutlines(imageData) {
        const w = imageData.width, h = imageData.height, data = imageData.data;
        const copy = new Uint8ClampedArray(data);

        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const idx = (y * w + x) * 4;

                // Sobel-like edge detection
                const gx = -this.getGrayScale(copy, ((y - 1) * w + x - 1) * 4) + this.getGrayScale(copy, ((y - 1) * w + x + 1) * 4);
                const gy = -this.getGrayScale(copy, ((y - 1) * w + x) * 4) + this.getGrayScale(copy, ((y + 1) * w + x) * 4);
                const mag = Math.sqrt(gx * gx + gy * gy);

                if (mag > 40) {
                    // Bold black outline
                    data[idx] = 0; data[idx + 1] = 0; data[idx + 2] = 0;
                }
            }
        }
        return imageData;
    }

    applyComicDots(imageData, dotSize) {
        const w = imageData.width, h = imageData.height, data = imageData.data;
        const size = Math.max(4, dotSize * 2);

        for (let y = 0; y < h; y += size) {
            for (let x = 0; x < w; x += size) {
                const idx = (y * w + x) * 4;
                const brightness = this.getGrayScale(data, idx);

                // Only add dots to mid-tone areas
                if (brightness > 50 && brightness < 200) {
                    const radius = (size / 3) * (1 - brightness / 255);
                    this.ctx.fillStyle = '#000000';
                    this.ctx.beginPath();
                    this.ctx.arc(x + size / 2, y + size / 2, radius, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        this.imageData = this.ctx.getImageData(0, 0, w, h);
        return this.imageData;
    }

    // ==========================================
    // PIPELINE RUNNER
    // ==========================================

    async runPipeline(img, steps) {
        this.imageData = this.setImage(img);

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            if (window.updateProcessingStep) {
                window.updateProcessingStep(i, step.name);
            }
            if (step.fn) {
                await new Promise(resolve => {
                    setTimeout(() => {
                        step.fn();
                        resolve();
                    }, 50); // Small delay for UI update
                });
            }
            // Update canvas after each step
            this.ctx.putImageData(this.imageData, 0, 0);
        }
        return this.canvas.toDataURL('image/png');
    }

    async processImage(img, style, params) {
        switch (style) {
            case 'pixel': return this.applyPixelArt(img, params);
            case 'blueprint': return this.applyBlueprint(img, params);
            case 'halftone': return this.applyHalftone(img, params);
            case 'oil': return this.applyOilPainting(img, params);
            case 'ascii': return this.applyASCII(img, params);
            case 'watercolor': return this.applyWatercolor(img, params);
            case 'stainedglass': return this.applyStainedGlass(img, params);
            case 'mosaic': return this.applyMosaic(img, params);
            case 'neon': return this.applyNeon(img, params);
            case 'sketch': return this.applySketch(img, params);
            case 'comic': return this.applyComic(img, params);
            case 'embroidery':
            default:
                return this.applyEmbroidery(img, params);
        }
    }
}

// UI Controller
class UIController {
    constructor() {
        this.pipeline = new CreativePipeline();
        this.currentFile = null;

        // Configuration for different styles
        this.styleConfig = {
            embroidery: {
                btnText: "Apply Embroidery Effect",
                methodology: `
                    <div class="accordion accordion-flush" id="methodologyAccordion">
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#step1">Step 1: K-Means Color Quantization</button></h2>
                            <div id="step1" class="accordion-collapse collapse show" data-bs-parent="#methodologyAccordion">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Unsupervised K-Means Clustering</p>
                                    <p>The image is reduced to a limited color palette (controlled by "Number of Colors" parameter) to simulate embroidery thread colors. The algorithm:</p>
                                    <ul>
                                        <li>Samples every 4th pixel for performance optimization</li>
                                        <li>Runs K-Means clustering with 5 iterations to find dominant colors</li>
                                        <li>Maps each pixel to its nearest centroid using Euclidean distance in RGB space: sqrt[(R1-R2)^2 + (G1-G2)^2 + (B1-B2)^2]</li>
                                        <li>Replaces all pixels with their cluster representative color</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Creates distinct color regions that mimic limited thread palette availability.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#step2">Step 2: Directional Thread Pattern Simulation</button></h2>
                            <div id="step2" class="accordion-collapse collapse" data-bs-parent="#methodologyAccordion">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Horizontal Box Blur Convolution</p>
                                    <p>Simulates the linear nature of embroidery stitches by applying a horizontal averaging filter:</p>
                                    <ul>
                                        <li>For each pixel, averages colors within a horizontal window of ±threadThickness pixels</li>
                                        <li>Creates directional blur that mimics parallel thread lines</li>
                                        <li>Preserves vertical edges while softening horizontal transitions</li>
                                        <li>Thread Thickness parameter (1-5) controls the stitch width</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Produces characteristic linear texture of embroidered fabric with visible stitch direction.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#step3">Step 3: Pixel Displacement (Fraying)</button></h2>
                            <div id="step3" class="accordion-collapse collapse" data-bs-parent="#methodologyAccordion">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Stochastic Pixel Redistribution</p>
                                    <p>Adds organic imperfection by randomly displacing pixels:</p>
                                    <ul>
                                        <li>Each pixel is randomly offset by ±spreadAmount in both X and Y directions</li>
                                        <li>Uses uniform random distribution: offset = random(-spread, +spread)</li>
                                        <li>Clamps coordinates to image boundaries to prevent artifacts</li>
                                        <li>Spread Amount parameter (1-5) controls fraying intensity</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Breaks up perfectly straight edges, simulating thread irregularity and fabric texture.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#step4">Step 4: Gaussian Noise Fabric Texture</button></h2>
                            <div id="step4" class="accordion-collapse collapse" data-bs-parent="#methodologyAccordion">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Additive Gaussian Noise</p>
                                    <p>Simulates fabric weave texture by adding controlled random noise:</p>
                                    <ul>
                                        <li>Generates random noise value: noise = (random() - 0.5) × 30</li>
                                        <li>Adds noise uniformly to all RGB channels: R/G/B += noise</li>
                                        <li>Clamps values to valid range [0, 255]</li>
                                        <li>Creates subtle brightness variations mimicking fabric grain</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Adds organic texture that prevents the image from looking too digital or flat.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#step5">Step 5: 3D Emboss Shading</button></h2>
                            <div id="step5" class="accordion-collapse collapse" data-bs-parent="#methodologyAccordion">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Vertical Gradient-Based Embossing</p>
                                    <p>Creates depth perception by simulating raised thread surfaces:</p>
                                    <ul>
                                        <li>Calculates vertical gradient: dy = grayscale(bottom_pixel) - grayscale(top_pixel)</li>
                                        <li>Grayscale conversion uses luminance formula: 0.299R + 0.587G + 0.114B</li>
                                        <li>Applies shading factor: color += dy × 0.5</li>
                                        <li>Positive gradients (darker below) create highlights; negative create shadows</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Produces 3D appearance with threads appearing to rise from the fabric surface.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#step6">Step 6: Color Brightness Enhancement</button></h2>
                            <div id="step6" class="accordion-collapse collapse" data-bs-parent="#methodologyAccordion">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Linear RGB Scaling</p>
                                    <p>Compensates for darkening from previous steps and enhances vibrancy:</p>
                                    <ul>
                                        <li>Multiplies each RGB channel by brightness factor: RGB × (brightness/100)</li>
                                        <li>Brightness parameter (80-120%) controls final luminosity</li>
                                        <li>Restores color intensity lost during texture processing</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Produces vibrant, saturated colors typical of embroidery thread while maintaining the textured appearance.</p>
                                </div>
                            </div>
                        </div>
                    </div>`
            },
            pixel: {
                btnText: "Apply Pixel Art Effect",
                methodology: `
                    <div class="accordion accordion-flush" id="methodologyPixel">
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#pStep1">Step 1: Resolution Downsampling (Pixelation)</button></h2>
                            <div id="pStep1" class="accordion-collapse collapse show" data-bs-parent="#methodologyPixel">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Nearest-Neighbor Downsampling with Upscaling</p>
                                    <p>Creates the characteristic blocky pixel art aesthetic through aggressive resolution reduction:</p>
                                    <ul>
                                        <li>Calculates block size: blockSize = max(2, threadThickness × 2)</li>
                                        <li>Downsamples to reduced dimensions: newWidth = width / blockSize, newHeight = height / blockSize</li>
                                        <li>Disables image smoothing (imageSmoothingEnabled = false) for sharp edges</li>
                                        <li>Upscales back to original size using nearest-neighbor interpolation</li>
                                        <li>Each "pixel" becomes a solid color block representing multiple original pixels</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Transforms smooth gradients into distinct color blocks, creating retro 8-bit/16-bit game graphics appearance.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#pStep2">Step 2: Palette Quantization</button></h2>
                            <div id="pStep2" class="accordion-collapse collapse" data-bs-parent="#methodologyPixel">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> K-Means Color Clustering (same as embroidery)</p>
                                    <p>Further reduces color complexity to match vintage gaming palettes:</p>
                                    <ul>
                                        <li>Applies K-Means clustering to limit colors to "Number of Colors" parameter</li>
                                        <li>Typical retro palettes: 4 colors (Game Boy), 8 colors (NES), 16 colors (EGA)</li>
                                        <li>Creates posterization effect with flat color regions</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Mimics hardware color limitations of classic gaming consoles and computers.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#pStep3">Step 3: Grid Line Rendering</button></h2>
                            <div id="pStep3" class="accordion-collapse collapse" data-bs-parent="#methodologyPixel">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Modulo-Based Grid Drawing</p>
                                    <p>Adds visible separation between pixel blocks to enhance the cross-stitch/pixel effect:</p>
                                    <ul>
                                        <li>For each pixel coordinate (x, y), checks if x % blockSize == 0 OR y % blockSize == 0</li>
                                        <li>If true, darkens that pixel by multiplying RGB values by 0.8 (20% darker)</li>
                                        <li>Creates consistent grid lines at block boundaries</li>
                                        <li>Simulates cross-stitch fabric mesh or CRT screen scanlines</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Emphasizes individual "pixels" and adds authentic retro gaming or needlework aesthetic.</p>
                                </div>
                            </div>
                        </div>
                    </div>`
            },
            blueprint: {
                btnText: "Apply Blueprint Style",
                methodology: `
                    <div class="accordion accordion-flush" id="methodologyBlueprint">
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#bStep1">Step 1: Sobel Edge Detection</button></h2>
                            <div id="bStep1" class="accordion-collapse collapse show" data-bs-parent="#methodologyBlueprint">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Sobel Operator (Gradient-Based Edge Detection)</p>
                                    <p>Extracts structural outlines from the chart using convolution kernels:</p>
                                    <ul>
                                        <li><strong>Horizontal Gradient (Gx):</strong> Applies kernel [-1, 0, +1; -2, 0, +2; -1, 0, +1]</li>
                                        <li><strong>Vertical Gradient (Gy):</strong> Applies kernel [-1, -2, -1; 0, 0, 0; +1, +2, +1]</li>
                                        <li>Calculates gradient magnitude: G = √(Gx² + Gy²)</li>
                                        <li>Applies threshold (50): pixels with G > 50 become white (255), others black (0)</li>
                                        <li>Converts to grayscale using luminance: 0.299R + 0.587G + 0.114B</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Isolates important structural lines (chart axes, data lines, labels) while removing fill colors and backgrounds.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#bStep2">Step 2: Blueprint Color Inversion</button></h2>
                            <div id="bStep2" class="accordion-collapse collapse" data-bs-parent="#methodologyBlueprint">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Conditional Color Mapping</p>
                                    <p>Applies the iconic blueprint color scheme (white lines on blue background):</p>
                                    <ul>
                                        <li><strong>Edge pixels (value > 128):</strong> Mapped to near-white with blue tint → RGB(240, 240, 255)</li>
                                        <li><strong>Background pixels (value ≤ 128):</strong> Mapped to blueprint blue → RGB(0, 68, 204) = #0044cc</li>
                                        <li>Mimics traditional cyanotype/blueprint printing process</li>
                                        <li>High contrast ensures readability of technical details</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Creates authentic architectural/engineering blueprint appearance with characteristic Prussian blue background.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#bStep3">Step 3: Technical Grid Overlay</button></h2>
                            <div id="bStep3" class="accordion-collapse collapse" data-bs-parent="#methodologyBlueprint">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Fixed-Interval Grid Drawing</p>
                                    <p>Adds measurement grid lines typical of technical drawings:</p>
                                    <ul>
                                        <li>Grid spacing: 50 pixels (fixed interval)</li>
                                        <li>For coordinates where x % 50 == 0 OR y % 50 == 0, brightens pixel by +30</li>
                                        <li>Creates subtle grid that doesn't overpower main content</li>
                                        <li>Simulates graph paper or measurement reference lines</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Enhances technical/architectural aesthetic and provides visual reference grid for measurements.</p>
                                </div>
                            </div>
                        </div>
                    </div>`
            },
            halftone: {
                btnText: "Apply Halftone Effect",
                methodology: `
                    <div class="accordion accordion-flush" id="methodologyHalftone">
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#hStep1">Step 1: Block-Based Brightness Sampling</button></h2>
                            <div id="hStep1" class="accordion-collapse collapse show" data-bs-parent="#methodologyHalftone">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Spatial Averaging with Luminance Calculation</p>
                                    <p>Analyzes local brightness to determine dot sizes:</p>
                                    <ul>
                                        <li>Divides image into blocks of size: dotSize = max(4, threadThickness × 2 + 2)</li>
                                        <li>For each block, calculates average grayscale value of all pixels</li>
                                        <li>Grayscale formula: 0.299R + 0.587G + 0.114B (perceptual luminance)</li>
                                        <li>Average brightness determines dot size for that region</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Creates brightness map that will control halftone dot distribution.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#hStep2">Step 2: Amplitude-Modulated Dot Generation</button></h2>
                            <div id="hStep2" class="accordion-collapse collapse" data-bs-parent="#methodologyHalftone">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Inverse Brightness-to-Radius Mapping</p>
                                    <p>Renders halftone dots with sizes inversely proportional to brightness:</p>
                                    <ul>
                                        <li>Clears canvas to white (#ffffff) - represents paper</li>
                                        <li>For each block, calculates dot radius: r = (dotSize/2) × (1 - brightness/255)</li>
                                        <li><strong>Dark areas (low brightness):</strong> Large dots (r approaches dotSize/2)</li>
                                        <li><strong>Light areas (high brightness):</strong> Small dots (r approaches 0)</li>
                                        <li>Draws filled circles at block centers using black ink (#000000)</li>
                                        <li>Uses Canvas arc() method for perfect circular dots</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Recreates newspaper/magazine printing technique where tonal variation is achieved through dot size modulation, not color change. Mimics CMYK printing process (single color channel).</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#hStep3">Technical Details</button></h2>
                            <div id="hStep3" class="accordion-collapse collapse" data-bs-parent="#methodologyHalftone">
                                <div class="accordion-body">
                                    <p><strong>Halftone Printing Background:</strong></p>
                                    <p>This effect simulates the AM (Amplitude Modulated) halftone screening used in traditional offset printing and pop art (Roy Lichtenstein style):</p>
                                    <ul>
                                        <li>Dots are evenly spaced (frequency-modulated would vary spacing)</li>
                                        <li>Only dot size changes to represent tonal values</li>
                                        <li>Typical screen frequencies: 65-150 LPI (lines per inch) in printing</li>
                                        <li>Our implementation uses pixel-based spacing controlled by Thread Thickness</li>
                                    </ul>
                                    <p><strong>Visual Perception:</strong> When viewed from distance, human eye integrates dots into continuous tones due to spatial averaging in visual cortex.</p>
                                </div>
                            </div>
                        </div>
                    </div>`
            },
            oil: {
                btnText: "Apply Oil Painting",
                methodology: `
                    <div class="accordion accordion-flush" id="methodologyOil">
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#oStep1">Step 1: Color Sampling from Original</button></h2>
                            <div id="oStep1" class="accordion-collapse collapse show" data-bs-parent="#methodologyOil">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Direct Pixel Color Extraction</p>
                                    <p>Reads color information from original image to guide brush strokes:</p>
                                    <ul>
                                        <li>Draws original image to canvas and extracts pixel data</li>
                                        <li>Stores complete RGBA array for color lookup</li>
                                        <li>Each brush stroke will sample color from a specific coordinate</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Ensures painted version maintains original color palette and composition.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#oStep2">Step 2: Stochastic Brush Stroke Placement</button></h2>
                            <div id="oStep2" class="accordion-collapse collapse" data-bs-parent="#methodologyOil">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Monte Carlo Random Sampling with Elliptical Strokes</p>
                                    <p>Simulates impasto painting technique with oriented brush strokes:</p>
                                    <ul>
                                        <li>Clears canvas to white (primed canvas)</li>
                                        <li>Calculates brush size: brushSize = max(3, threadThickness × 2)</li>
                                        <li>Generates (width × height) / 2 random stroke positions</li>
                                        <li>For each stroke:
                                            <ul>
                                                <li>Random position: x = random(0, width), y = random(0, height)</li>
                                                <li>Samples RGB color from that coordinate</li>
                                                <li>Random orientation: angle = random(0, π)</li>
                                                <li>Draws ellipse with dimensions: width = brushSize × 2, height = brushSize / 2</li>
                                            </ul>
                                        </li>
                                        <li>Uses Canvas transformation matrix for rotation</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Creates characteristic directional brush strokes with visible texture and orientation variation.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#oStep3">Step 3: Layered Stroke Application</button></h2>
                            <div id="oStep3" class="accordion-collapse collapse" data-bs-parent="#methodologyOil">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Additive Blending with Overlap</p>
                                    <p>Builds up paint layers through multiple overlapping strokes:</p>
                                    <ul>
                                        <li>Strokes are applied sequentially without clearing between them</li>
                                        <li>Later strokes partially cover earlier ones (painter's algorithm)</li>
                                        <li>Overlap creates color mixing and depth</li>
                                        <li>Random positioning ensures organic, non-uniform coverage</li>
                                        <li>Some areas receive multiple strokes (darker), others fewer (lighter)</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Produces thick, textured appearance of oil paint with visible brushwork. Mimics impasto technique where paint is applied thickly enough to show brush/palette knife marks.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#oStep4">Artistic Technique Simulation</button></h2>
                            <div id="oStep4" class="accordion-collapse collapse" data-bs-parent="#methodologyOil">
                                <div class="accordion-body">
                                    <p><strong>Art Historical Context:</strong></p>
                                    <p>This algorithm simulates techniques used by Impressionist and Post-Impressionist painters:</p>
                                    <ul>
                                        <li><strong>Van Gogh:</strong> Thick, directional strokes with visible texture</li>
                                        <li><strong>Monet:</strong> Broken color and loose brushwork</li>
                                        <li><strong>Impasto:</strong> Paint applied thickly enough to stand out from canvas</li>
                                    </ul>
                                    <p>The random orientation and elliptical shape create the characteristic "painterly" quality where individual brush strokes remain visible rather than blending into smooth gradients.</p>
                                </div>
                            </div>
                        </div>
                    </div>`
            },
            ascii: {
                btnText: "Generate ASCII Art",
                methodology: `
                    <div class="accordion accordion-flush" id="methodologyAscii">
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#aStep1">Step 1: Resolution Downsampling</button></h2>
                            <div id="aStep1" class="accordion-collapse collapse show" data-bs-parent="#methodologyAscii">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Fixed-Column Aspect-Ratio Correction</p>
                                    <p>Reduces image to character-grid resolution:</p>
                                    <ul>
                                        <li>Target columns: 100 characters (fixed for readability)</li>
                                        <li>Character width: charW = imageWidth / 100</li>
                                        <li>Rows calculation: rows = floor(imageHeight / charW × 0.5)</li>
                                        <li><strong>0.5 multiplier:</strong> Compensates for character aspect ratio (characters are ~2× taller than wide)</li>
                                        <li>Downsamples image to 100×rows using Canvas drawImage()</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Creates low-resolution version where each pixel will map to one character.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#aStep2">Step 2: Brightness-to-Character Mapping</button></h2>
                            <div id="aStep2" class="accordion-collapse collapse" data-bs-parent="#methodologyAscii">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Luminance-Based Character Selection</p>
                                    <p>Maps pixel brightness to ASCII characters with increasing visual density:</p>
                                    <ul>
                                        <li>Character set: " .:-=+*#%@" (10 characters, light to dark)</li>
                                        <li>For each pixel, calculates average brightness: (R + G + B) / 3</li>
                                        <li>Maps brightness [0-255] to character index [0-9]: index = floor((brightness/255) × 9)</li>
                                        <li><strong>Character density progression:</strong>
                                            <ul>
                                                <li>Space (lightest): minimal ink</li>
                                                <li>. : - = + (increasing density)</li>
                                                <li>* # % @ (darkest): maximum ink coverage</li>
                                            </ul>
                                        </li>
                                    </ul>
                                    <p><strong>Effect:</strong> Bright areas use sparse characters, dark areas use dense characters, creating tonal variation.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#aStep3">Step 3: Terminal-Style Rendering</button></h2>
                            <div id="aStep3" class="accordion-collapse collapse" data-bs-parent="#methodologyAscii">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Canvas Text Rendering with Monospace Font</p>
                                    <p>Renders characters in retro terminal aesthetic:</p>
                                    <ul>
                                        <li>Background: Pure black (#000000) - simulates CRT screen</li>
                                        <li>Text color: Bright green (#00ff00) - classic "Matrix" / terminal green phosphor</li>
                                        <li>Font: Monospace at size charW × 1.5 (ensures characters fill space)</li>
                                        <li>Vertical spacing: charW × 2 (accounts for character aspect ratio)</li>
                                        <li>textBaseline: 'top' for precise positioning</li>
                                        <li>Each character drawn at grid position (x × charW, y × charW × 2)</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Creates authentic retro computer terminal or "Matrix" digital rain aesthetic.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#aStep4">Historical Context</button></h2>
                            <div id="aStep4" class="accordion-collapse collapse" data-bs-parent="#methodologyAscii">
                                <div class="accordion-body">
                                    <p><strong>ASCII Art History:</strong></p>
                                    <ul>
                                        <li><strong>1960s-70s:</strong> Used in early computer systems with no graphics capability (teletypes, line printers)</li>
                                        <li><strong>BBS Era (1980s):</strong> Popular in bulletin board systems and early internet</li>
                                        <li><strong>Modern Usage:</strong> Retro aesthetic, terminal UIs, accessibility</li>
                                    </ul>
                                    <p><strong>Character Selection:</strong> Our character set is optimized for visual density progression. Alternative sets with up to 70 characters exist for more detailed gradations.</p>
                <p><strong>Green Phosphor:</strong> The #00ff00 color mimics P1 phosphor used in early monochrome CRT terminals (IBM 3270, VT100).</p>
                                </div>
                            </div >
                        </div >
                    </div > `
            },
            watercolor: {
                btnText: "Apply Watercolor Effect",
                methodology: `
                    <div class="accordion accordion-flush" id="methodologyWatercolor">
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#wStep1">Step 1: Color Bleeding Simulation</button></h2>
                            <div id="wStep1" class="accordion-collapse collapse show" data-bs-parent="#methodologyWatercolor">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Multi-Pass Stochastic Displacement</p>
                                    <p>Simulates watercolor paint bleeding into adjacent areas:</p>
                                    <ul>
                                        <li>Applies pixel spread algorithm 3 times consecutively</li>
                                        <li>Each pass uses 2x the Spread Amount parameter</li>
                                        <li>Creates soft, organic color transitions</li>
                                        <li>Mimics water-based paint diffusion on paper</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Colors blend naturally into each other, creating the characteristic watercolor "bloom" effect.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#wStep2">Step 2: Paper Texture</button></h2>
                            <div id="wStep2" class="accordion-collapse collapse" data-bs-parent="#methodologyWatercolor">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Additive Gaussian Noise with Brightness Boost</p>
                                    <p>Simulates watercolor paper grain:</p>
                                    <ul>
                                        <li>Adds random noise: +/- 7.5 per RGB channel</li>
                                        <li>Applies +10 brightness boost to simulate white paper</li>
                                        <li>Creates subtle texture variations</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Adds organic paper texture and prevents flat digital appearance.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#wStep3">Step 3: Soft Edge Blurring</button></h2>
                            <div id="wStep3" class="accordion-collapse collapse" data-bs-parent="#methodologyWatercolor">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Box Blur Convolution</p>
                                    <p>Creates soft, diffused edges characteristic of watercolor:</p>
                                    <ul>
                                        <li>Applies averaging filter across Thread Thickness radius</li>
                                        <li>Softens all edges uniformly</li>
                                        <li>Removes hard digital boundaries</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Produces dreamy, soft-focus watercolor aesthetic with no sharp edges.</p>
                                </div>
                            </div>
                        </div>
                    </div>`
            },
            stainedglass: {
                btnText: "Apply Stained Glass Effect",
                methodology: `
                    <div class="accordion accordion-flush" id="methodologyStainedGlass">
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#sgStep1">Step 1: Glass Segment Creation</button></h2>
                            <div id="sgStep1" class="accordion-collapse collapse show" data-bs-parent="#methodologyStainedGlass">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> K-Means Color Quantization</p>
                                    <p>Creates distinct colored glass pieces:</p>
                                    <ul>
                                        <li>Reduces image to limited palette (Number of Colors parameter)</li>
                                        <li>Each color represents a separate glass piece</li>
                                        <li>Creates flat color regions like real stained glass</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Produces bold, vibrant color segments typical of church windows.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#sgStep2">Step 2: Lead Came Lines</button></h2>
                            <div id="sgStep2" class="accordion-collapse collapse" data-bs-parent="#methodologyStainedGlass">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Color Boundary Detection</p>
                                    <p>Adds dark lead lines between glass pieces:</p>
                                    <ul>
                                        <li>Compares each pixel with right and bottom neighbors</li>
                                        <li>Calculates color difference: sum of RGB deltas</li>
                                        <li>If difference exceeds 100, draws black line (RGB 20,20,20)</li>
                                        <li>Simulates lead came (metal framework) in real stained glass</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Creates authentic dark outlines separating colored glass segments.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#sgStep3">Step 3: Glass Reflections</button></h2>
                            <div id="sgStep3" class="accordion-collapse collapse" data-bs-parent="#methodologyStainedGlass">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Stochastic Highlight Generation</p>
                                    <p>Simulates light reflections on glass surface:</p>
                                    <ul>
                                        <li>2% probability per pixel of adding highlight</li>
                                        <li>Adds +80 to all RGB channels for bright spots</li>
                                        <li>Creates random sparkle effect</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Adds realistic glass shine and light reflections.</p>
                                </div>
                            </div>
                        </div>
                    </div>`
            },
            mosaic: {
                btnText: "Apply Mosaic Tiles Effect",
                methodology: `
                    <div class="accordion accordion-flush" id="methodologyMosaic">
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#mStep1">Step 1: Tile Block Creation</button></h2>
                            <div id="mStep1" class="accordion-collapse collapse show" data-bs-parent="#methodologyMosaic">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Grid-Based Color Sampling with Gradient Overlay</p>
                                    <p>Creates individual mosaic tiles:</p>
                                    <ul>
                                        <li>Tile size = max(8, Thread Thickness x 3)</li>
                                        <li>Samples color from center of each tile region</li>
                                        <li>Fills entire tile with sampled color</li>
                                        <li>Applies diagonal gradient: white (20% opacity) to black (20% opacity)</li>
                                        <li>Creates 3D beveled appearance on each tile</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Produces individual colored tiles with subtle 3D depth.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#mStep2">Step 2: Grout Lines</button></h2>
                            <div id="mStep2" class="accordion-collapse collapse" data-bs-parent="#methodologyMosaic">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Modulo-Based Grid Drawing</p>
                                    <p>Adds grout (cement) between tiles:</p>
                                    <ul>
                                        <li>2-pixel wide grout lines</li>
                                        <li>Drawn at tile boundaries using modulo operation</li>
                                        <li>Light gray color (RGB 200,200,200)</li>
                                        <li>Separates all tiles uniformly</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Creates authentic mosaic appearance with visible grout lines, mimicking Roman or Byzantine mosaics.</p>
                                </div>
                            </div>
                        </div>
                    </div>`
            },
            neon: {
                btnText: "Apply Neon Glow Effect",
                methodology: `
                    <div class="accordion accordion-flush" id="methodologyNeon">
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#nStep1">Step 1: Edge Detection</button></h2>
                            <div id="nStep1" class="accordion-collapse collapse show" data-bs-parent="#methodologyNeon">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Sobel Operator</p>
                                    <p>Isolates edges that will become neon tubes:</p>
                                    <ul>
                                        <li>Applies Sobel gradient detection</li>
                                        <li>Threshold at 50 for edge/non-edge classification</li>
                                        <li>Converts to binary: white edges, black background</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Extracts line art that will be transformed into glowing neon.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#nStep2">Step 2: Glow Generation</button></h2>
                            <div id="nStep2" class="accordion-collapse collapse" data-bs-parent="#methodologyNeon">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Radial Gradient Blur with Distance Falloff</p>
                                    <p>Creates neon tube glow effect:</p>
                                    <ul>
                                        <li>For each bright pixel (value greater than 128), creates glow halo</li>
                                        <li>Glow radius: 5 pixels</li>
                                        <li>Falloff function: intensity = max(0, 1 - distance/radius)</li>
                                        <li>Cyan-green glow color: adds RGB(100, 255, 200) with falloff</li>
                                        <li>Multiple overlapping glows create bright core with soft edges</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Produces characteristic neon tube glow with bright center fading to darkness.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#nStep3">Step 3: Dark Background</button></h2>
                            <div id="nStep3" class="accordion-collapse collapse" data-bs-parent="#methodologyNeon">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Conditional Darkening</p>
                                    <p>Creates night-time neon sign aesthetic:</p>
                                    <ul>
                                        <li>Identifies dark pixels (all RGB channels less than 50)</li>
                                        <li>Sets to near-black: RGB(10, 10, 20) with slight blue tint</li>
                                        <li>Preserves glowing areas</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Simulates neon signs glowing in darkness, maximizing contrast and visual impact.</p>
                                </div>
                            </div>
                        </div>
                    </div>`
            },
            sketch: {
                btnText: "Apply Pencil Sketch Effect",
                methodology: `
                    <div class="accordion accordion-flush" id="methodologySketch">
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#skStep1">Step 1: Grayscale Conversion</button></h2>
                            <div id="skStep1" class="accordion-collapse collapse show" data-bs-parent="#methodologySketch">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Luminance-Based Grayscale</p>
                                    <p>Converts to black and white for pencil effect:</p>
                                    <ul>
                                        <li>Uses perceptual luminance formula: 0.299R + 0.587G + 0.114B</li>
                                        <li>Sets all RGB channels to calculated grayscale value</li>
                                        <li>Removes color information</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Creates monochrome base for pencil drawing simulation.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#skStep2">Step 2: Sketch Line Detection</button></h2>
                            <div id="skStep2" class="accordion-collapse collapse" data-bs-parent="#methodologySketch">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Color Dodge Blend Mode</p>
                                    <p>Creates pencil stroke appearance using Photoshop-style technique:</p>
                                    <ul>
                                        <li>Inverts grayscale image (negative)</li>
                                        <li>Applies blur to inverted image (radius = 2)</li>
                                        <li>Blends with original using Color Dodge formula: result = min(255, base x 256 / (255 - blend))</li>
                                        <li>Bright areas become white paper, dark edges become pencil lines</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Produces hand-drawn pencil sketch with varying line weights and shading.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#skStep3">Step 3: Paper Texture</button></h2>
                            <div id="skStep3" class="accordion-collapse collapse" data-bs-parent="#methodologySketch">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Additive Noise (same as watercolor)</p>
                                    <p>Simulates drawing paper grain:</p>
                                    <ul>
                                        <li>Adds subtle random noise to prevent digital smoothness</li>
                                        <li>Slight brightness boost for white paper appearance</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Adds realistic paper texture to complete the hand-drawn look.</p>
                                </div>
                            </div>
                        </div>
                    </div>`
            },
            comic: {
                btnText: "Apply Comic Book Effect",
                methodology: `
                    <div class="accordion accordion-flush" id="methodologyComic">
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#cStep1">Step 1: Color Posterization</button></h2>
                            <div id="cStep1" class="accordion-collapse collapse show" data-bs-parent="#methodologyComic">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> K-Means Clustering</p>
                                    <p>Creates bold, flat color areas:</p>
                                    <ul>
                                        <li>Reduces to limited palette (Number of Colors parameter)</li>
                                        <li>Typical comic books use 4-8 colors per panel</li>
                                        <li>Eliminates gradients for cel-shaded look</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Produces flat color regions typical of comic book printing.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#cStep2">Step 2: Bold Ink Outlines</button></h2>
                            <div id="cStep2" class="accordion-collapse collapse" data-bs-parent="#methodologyComic">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Sobel Edge Detection with Threshold</p>
                                    <p>Adds characteristic comic book ink lines:</p>
                                    <ul>
                                        <li>Detects edges using Sobel operator</li>
                                        <li>Threshold at 40 for bold line detection</li>
                                        <li>Draws pure black (RGB 0,0,0) outlines</li>
                                        <li>Mimics hand-inked comic artwork</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Creates bold black outlines that define shapes and characters.</p>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#cStep3">Step 3: Ben-Day Dots</button></h2>
                            <div id="cStep3" class="accordion-collapse collapse" data-bs-parent="#methodologyComic">
                                <div class="accordion-body">
                                    <p><strong>Algorithm:</strong> Selective Halftone Dot Placement</p>
                                    <p>Adds vintage comic book printing dots:</p>
                                    <ul>
                                        <li>Only applies to mid-tone areas (brightness 50-200)</li>
                                        <li>Dot size inversely proportional to brightness</li>
                                        <li>Dot spacing controlled by Thread Thickness x 2</li>
                                        <li>Mimics Ben-Day dots used in 1950s-60s comics (Roy Lichtenstein style)</li>
                                    </ul>
                                    <p><strong>Effect:</strong> Creates authentic vintage comic book aesthetic with visible printing dots for shading.</p>
                                </div>
                            </div>
                        </div>
                    </div>`
            }
        };

        this.initializeElements();
        this.attachEventListeners();
        this.updateParameterDisplays();
        this.updateStyleUI(); // Initial update
    }

    initializeElements() {
        this.uploadZone = document.getElementById('uploadZone');
        this.fileInput = document.getElementById('fileInput');
        this.processBtn = document.getElementById('processBtn');
        this.processingSteps = document.getElementById('processingSteps');
        this.stepsContainer = document.getElementById('stepsContainer');
        this.resultsSection = document.getElementById('resultsSection');
        this.originalImage = document.getElementById('originalImage');
        this.embroideredImage = document.getElementById('embroideredImage');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.methodologyContainer = document.getElementById('methodologyContainer');

        this.styleSelect = document.getElementById('styleSelect');

        // Parameter inputs
        this.numColors = document.getElementById('numColors');
        this.threadThickness = document.getElementById('threadThickness');
        this.spreadAmount = document.getElementById('spreadAmount');
        this.brightness = document.getElementById('brightness');
    }

    attachEventListeners() {
        this.uploadZone.addEventListener('click', () => this.fileInput.click());
        this.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadZone.classList.add('dragover');
        });
        this.uploadZone.addEventListener('dragleave', () => {
            this.uploadZone.classList.remove('dragover');
        });
        this.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this.handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        this.processBtn.addEventListener('click', () => this.processImage());
        this.downloadBtn.addEventListener('click', () => this.downloadImage());

        [this.numColors, this.threadThickness, this.spreadAmount, this.brightness].forEach(input => {
            input.addEventListener('input', () => this.updateParameterDisplays());
        });

        this.styleSelect.addEventListener('change', () => {
            this.updateStyleUI();
        });
    }

    updateStyleUI() {
        const style = this.styleSelect.value;
        const config = this.styleConfig[style];

        // Update Button Text
        if (config) {
            this.processBtn.innerHTML = `<i class="bi bi-magic me-2"></i>${config.btnText}`;
            this.methodologyContainer.innerHTML = config.methodology;
        }

        // Update Result Title
        const titleEl = document.querySelector('#resultsSection .col-12:last-child h5');
        if (titleEl) titleEl.textContent = `${style.charAt(0).toUpperCase() + style.slice(1)} Version`;
    }

    updateParameterDisplays() {
        document.getElementById('numColorsValue').textContent = this.numColors.value;
        document.getElementById('threadThicknessValue').textContent = this.threadThickness.value;
        document.getElementById('spreadAmountValue').textContent = this.spreadAmount.value;
        document.getElementById('brightnessValue').textContent = this.brightness.value;
    }

    handleFileSelect(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        this.currentFile = file;
        this.processBtn.disabled = false;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.uploadZone.innerHTML = `
                <img src="${e.target.result}" alt="Uploaded preview" style="max-width: 100%; max-height: 300px; border-radius: 10px;">
                <p class="mt-3 text-white">File loaded: ${file.name}</p>
                <p class="text-white-50">Select a style and click "Apply"</p>
            `;
        };
        reader.readAsDataURL(file);
    }

    async processImage() {
        if (!this.currentFile) return;

        this.resultsSection.classList.add('d-none');
        this.processingSteps.classList.remove('d-none');
        this.processBtn.disabled = true;
        this.stepsContainer.innerHTML = ''; // Clear previous steps

        // Global function for pipeline steps
        window.updateProcessingStep = (idx, name) => {
            // Check if exists
            if (!document.getElementById(`step-${idx}`)) {
                this.stepsContainer.innerHTML += `
                    <div class="processing-step" id="step-${idx}">
                        <i class="bi bi-circle me-2"></i>
                        <span>${name}</span>
                    </div>`;
            }

            // Update all active/inactive
            document.querySelectorAll('.processing-step').forEach(el => {
                if (el.id === `step-${idx}`) {
                    el.classList.add('active');
                    el.querySelector('i').className = 'bi bi-arrow-right-circle-fill me-2 text-warning';
                } else {
                    el.classList.remove('active');
                    // check if previous
                    if (parseInt(el.id.split('-')[1]) < idx) {
                        el.querySelector('i').className = 'bi bi-check-circle-fill me-2 text-success';
                    }
                }
            });
        };

        try {
            const img = await this.pipeline.loadImage(this.currentFile);
            const style = this.styleSelect.value;
            const params = {
                numColors: parseInt(this.numColors.value),
                threadThickness: parseInt(this.threadThickness.value),
                spreadAmount: parseInt(this.spreadAmount.value),
                brightness: parseInt(this.brightness.value)
            };

            const result = await this.pipeline.processImage(img, style, params);

            this.originalImage.src = URL.createObjectURL(this.currentFile);
            this.embroideredImage.src = result;
            this.embroideredImage.dataset.url = result;

            // Mark all done
            document.querySelectorAll('.processing-step').forEach(el => {
                el.classList.remove('active');
                el.querySelector('i').className = 'bi bi-check-circle-fill me-2 text-success';
            });

            this.resultsSection.classList.remove('d-none');
            this.processBtn.disabled = false;

            // Scroll to results
            this.resultsSection.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('Processing error:', error);
            alert('Error processing image: ' + error.message);
            this.processBtn.disabled = false;
        }
    }

    downloadImage() {
        const url = this.embroideredImage.dataset.url;
        if (!url) return;
        const link = document.createElement('a');
        link.href = url;
        link.download = `creative_chart_${this.styleSelect.value}.png`;
        link.click();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new UIController();
});
