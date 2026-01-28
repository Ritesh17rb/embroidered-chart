// Embroidered Charts Pipeline - Client-side Processing
// This implementation simulates the ImageMagick pipeline using Canvas API

class EmbroideryPipeline {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.steps = [];
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

    // Step 1: Color Quantization (simulates embroidery.sh color reduction)
    quantizeColors(imageData, numColors) {
        const data = imageData.data;
        const pixels = [];

        // Collect all unique colors
        for (let i = 0; i < data.length; i += 4) {
            pixels.push([data[i], data[i + 1], data[i + 2]]);
        }

        // K-means clustering for color quantization
        const palette = this.kMeansClustering(pixels, numColors);

        // Map each pixel to nearest palette color
        for (let i = 0; i < data.length; i += 4) {
            const nearest = this.findNearestColor([data[i], data[i + 1], data[i + 2]], palette);
            data[i] = nearest[0];
            data[i + 1] = nearest[1];
            data[i + 2] = nearest[2];
        }

        return imageData;
    }

    kMeansClustering(pixels, k, maxIterations = 10) {
        // Initialize centroids randomly
        let centroids = [];
        for (let i = 0; i < k; i++) {
            const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
            centroids.push([...randomPixel]);
        }

        for (let iter = 0; iter < maxIterations; iter++) {
            // Assign pixels to nearest centroid
            const clusters = Array(k).fill(null).map(() => []);

            pixels.forEach(pixel => {
                const nearestIdx = this.findNearestColorIndex(pixel, centroids);
                clusters[nearestIdx].push(pixel);
            });

            // Update centroids
            centroids = clusters.map(cluster => {
                if (cluster.length === 0) return centroids[0];
                const sum = cluster.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
                return [
                    Math.round(sum[0] / cluster.length),
                    Math.round(sum[1] / cluster.length),
                    Math.round(sum[2] / cluster.length)
                ];
            });
        }

        return centroids;
    }

    findNearestColor(pixel, palette) {
        let minDist = Infinity;
        let nearest = palette[0];

        palette.forEach(color => {
            const dist = Math.sqrt(
                Math.pow(pixel[0] - color[0], 2) +
                Math.pow(pixel[1] - color[1], 2) +
                Math.pow(pixel[2] - color[2], 2)
            );
            if (dist < minDist) {
                minDist = dist;
                nearest = color;
            }
        });

        return nearest;
    }

    findNearestColorIndex(pixel, palette) {
        let minDist = Infinity;
        let nearestIdx = 0;

        palette.forEach((color, idx) => {
            const dist = Math.sqrt(
                Math.pow(pixel[0] - color[0], 2) +
                Math.pow(pixel[1] - color[1], 2) +
                Math.pow(pixel[2] - color[2], 2)
            );
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = idx;
            }
        });

        return nearestIdx;
    }

    // Step 2: Thread Pattern Simulation
    applyThreadPattern(imageData, thickness = 3) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const newData = new Uint8ClampedArray(data);

        // Create directional blur to simulate thread stitches
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;

                // Sample pixels in a line (simulating stitch direction)
                let r = 0, g = 0, b = 0, count = 0;

                for (let dx = -thickness; dx <= thickness; dx++) {
                    const nx = x + dx;
                    if (nx >= 0 && nx < width) {
                        const nidx = (y * width + nx) * 4;
                        r += data[nidx];
                        g += data[nidx + 1];
                        b += data[nidx + 2];
                        count++;
                    }
                }

                newData[idx] = r / count;
                newData[idx + 1] = g / count;
                newData[idx + 2] = b / count;
            }
        }

        for (let i = 0; i < data.length; i++) {
            data[i] = newData[i];
        }

        return imageData;
    }

    // Step 3: Spread (Fraying) - simulates -spread command
    applySpread(imageData, amount = 2) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const newData = new Uint8ClampedArray(data);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Random displacement
                const dx = Math.floor((Math.random() - 0.5) * amount * 2);
                const dy = Math.floor((Math.random() - 0.5) * amount * 2);

                const nx = Math.max(0, Math.min(width - 1, x + dx));
                const ny = Math.max(0, Math.min(height - 1, y + dy));

                const srcIdx = (ny * width + nx) * 4;
                const dstIdx = (y * width + x) * 4;

                newData[dstIdx] = data[srcIdx];
                newData[dstIdx + 1] = data[srcIdx + 1];
                newData[dstIdx + 2] = data[srcIdx + 2];
                newData[dstIdx + 3] = data[srcIdx + 3];
            }
        }

        for (let i = 0; i < data.length; i++) {
            data[i] = newData[i];
        }

        return imageData;
    }

    // Step 4: Fabric Texture (Noise + Motion Blur + Soft Light)
    applyFabricTexture(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        // Create noise layer
        const noiseData = new Uint8ClampedArray(data.length);
        for (let i = 0; i < noiseData.length; i += 4) {
            const noise = Math.random() * 255;
            noiseData[i] = noise;
            noiseData[i + 1] = noise;
            noiseData[i + 2] = noise;
            noiseData[i + 3] = 255;
        }

        // Apply vertical motion blur to noise
        const blurredNoise = new Uint8ClampedArray(noiseData);
        const blurRadius = 8;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sum = 0, count = 0;

                for (let dy = -blurRadius; dy <= blurRadius; dy++) {
                    const ny = y + dy;
                    if (ny >= 0 && ny < height) {
                        const idx = (ny * width + x) * 4;
                        sum += noiseData[idx];
                        count++;
                    }
                }

                const idx = (y * width + x) * 4;
                const avgNoise = sum / count;
                blurredNoise[idx] = avgNoise;
                blurredNoise[idx + 1] = avgNoise;
                blurredNoise[idx + 2] = avgNoise;
            }
        }

        // Soft Light blend
        for (let i = 0; i < data.length; i += 4) {
            const base = [data[i], data[i + 1], data[i + 2]];
            const blend = blurredNoise[i] / 255;

            for (let c = 0; c < 3; c++) {
                const b = base[c] / 255;
                let result;

                if (blend < 0.5) {
                    result = 2 * b * blend + b * b * (1 - 2 * blend);
                } else {
                    result = 2 * b * (1 - blend) + Math.sqrt(b) * (2 * blend - 1);
                }

                data[i + c] = Math.round(result * 255);
            }
        }

        return imageData;
    }

    // Step 5: 3D Shading (Shade Map + Overlay)
    apply3DShading(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        // Convert to grayscale for depth map
        const grayData = new Uint8ClampedArray(data.length);
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            grayData[i] = gray;
            grayData[i + 1] = gray;
            grayData[i + 2] = gray;
            grayData[i + 3] = 255;
        }

        // Apply slight blur to grayscale
        const blurred = this.gaussianBlur(grayData, width, height, 2);

        // Create shade map (simplified version of -shade 120x55)
        const shadeMap = new Uint8ClampedArray(data.length);
        const azimuth = 120 * Math.PI / 180;
        const elevation = 55 * Math.PI / 180;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;

                // Calculate gradients
                const gx = (
                    blurred[((y - 1) * width + (x + 1)) * 4] -
                    blurred[((y - 1) * width + (x - 1)) * 4] +
                    2 * (blurred[(y * width + (x + 1)) * 4] - blurred[(y * width + (x - 1)) * 4]) +
                    blurred[((y + 1) * width + (x + 1)) * 4] -
                    blurred[((y + 1) * width + (x - 1)) * 4]
                ) / 8;

                const gy = (
                    blurred[((y + 1) * width + (x - 1)) * 4] -
                    blurred[((y - 1) * width + (x - 1)) * 4] +
                    2 * (blurred[((y + 1) * width + x) * 4] - blurred[((y - 1) * width + x) * 4]) +
                    blurred[((y + 1) * width + (x + 1)) * 4] -
                    blurred[((y - 1) * width + (x + 1)) * 4]
                ) / 8;

                // Calculate shading
                const shade = Math.cos(elevation) * Math.cos(azimuth) * gx +
                    Math.cos(elevation) * Math.sin(azimuth) * gy +
                    Math.sin(elevation) * 255;

                const normalizedShade = Math.max(0, Math.min(255, shade + 128));
                shadeMap[idx] = normalizedShade;
                shadeMap[idx + 1] = normalizedShade;
                shadeMap[idx + 2] = normalizedShade;
            }
        }

        // Overlay blend mode
        for (let i = 0; i < data.length; i += 4) {
            const base = [data[i], data[i + 1], data[i + 2]];
            const overlay = shadeMap[i] / 255;

            for (let c = 0; c < 3; c++) {
                const b = base[c] / 255;
                let result;

                if (b < 0.5) {
                    result = 2 * b * overlay;
                } else {
                    result = 1 - 2 * (1 - b) * (1 - overlay);
                }

                data[i + c] = Math.round(result * 255);
            }
        }

        return imageData;
    }

    gaussianBlur(data, width, height, radius) {
        const blurred = new Uint8ClampedArray(data);
        const kernel = this.createGaussianKernel(radius);
        const kernelSize = kernel.length;
        const half = Math.floor(kernelSize / 2);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sum = 0, weightSum = 0;

                for (let ky = 0; ky < kernelSize; ky++) {
                    for (let kx = 0; kx < kernelSize; kx++) {
                        const ny = y + ky - half;
                        const nx = x + kx - half;

                        if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                            const idx = (ny * width + nx) * 4;
                            const weight = kernel[ky][kx];
                            sum += data[idx] * weight;
                            weightSum += weight;
                        }
                    }
                }

                const idx = (y * width + x) * 4;
                const value = sum / weightSum;
                blurred[idx] = value;
                blurred[idx + 1] = value;
                blurred[idx + 2] = value;
            }
        }

        return blurred;
    }

    createGaussianKernel(radius) {
        const size = radius * 2 + 1;
        const kernel = [];
        const sigma = radius / 2;
        let sum = 0;

        for (let y = 0; y < size; y++) {
            kernel[y] = [];
            for (let x = 0; x < size; x++) {
                const dx = x - radius;
                const dy = y - radius;
                const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
                kernel[y][x] = value;
                sum += value;
            }
        }

        // Normalize
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                kernel[y][x] /= sum;
            }
        }

        return kernel;
    }

    // Step 6: Color Boost (Modulate)
    applyColorBoost(imageData, brightness = 115, saturation = 105) {
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            // Convert RGB to HSL
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0;
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

                switch (max) {
                    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                    case g: h = ((b - r) / d + 2) / 6; break;
                    case b: h = ((r - g) / d + 4) / 6; break;
                }
            }

            // Apply modulation
            l = Math.min(1, l * (brightness / 100));
            s = Math.min(1, s * (saturation / 100));

            // Convert back to RGB
            const rgb = this.hslToRgb(h, s, l);
            data[i] = Math.round(rgb[0] * 255);
            data[i + 1] = Math.round(rgb[1] * 255);
            data[i + 2] = Math.round(rgb[2] * 255);
        }

        return imageData;
    }

    hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return [r, g, b];
    }

    async processImage(img, params) {
        const steps = [
            { name: 'Loading image...', fn: null },
            { name: 'Quantizing colors (embroidery.sh simulation)...', fn: () => this.quantizeColors(this.imageData, params.numColors) },
            { name: 'Applying thread pattern...', fn: () => this.applyThreadPattern(this.imageData, params.threadThickness) },
            { name: 'Spreading pixels (fraying edges)...', fn: () => this.applySpread(this.imageData, params.spreadAmount) },
            { name: 'Adding fabric texture...', fn: () => this.applyFabricTexture(this.imageData) },
            { name: 'Applying 3D shading...', fn: () => this.apply3DShading(this.imageData) },
            { name: 'Boosting colors...', fn: () => this.applyColorBoost(this.imageData, params.brightness, 105) },
            { name: 'Complete!', fn: null }
        ];

        this.imageData = this.setImage(img);

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];

            // Update UI
            if (window.updateProcessingStep) {
                window.updateProcessingStep(i, step.name);
            }

            // Execute step
            if (step.fn) {
                await new Promise(resolve => {
                    setTimeout(() => {
                        step.fn();
                        resolve();
                    }, 100);
                });
            } else {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // Put processed image back on canvas
        this.ctx.putImageData(this.imageData, 0, 0);

        return this.canvas.toDataURL('image/png');
    }
}

// UI Controller
class UIController {
    constructor() {
        this.pipeline = new EmbroideryPipeline();
        this.currentFile = null;
        this.initializeElements();
        this.attachEventListeners();
        this.updateParameterDisplays();
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

        // Parameter inputs
        this.numColors = document.getElementById('numColors');
        this.threadThickness = document.getElementById('threadThickness');
        this.spreadAmount = document.getElementById('spreadAmount');
        this.brightness = document.getElementById('brightness');
    }

    attachEventListeners() {
        // Upload zone
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

        // File input
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Process button
        this.processBtn.addEventListener('click', () => this.processImage());

        // Download button
        this.downloadBtn.addEventListener('click', () => this.downloadImage());

        // Parameter updates
        [this.numColors, this.threadThickness, this.spreadAmount, this.brightness].forEach(input => {
            input.addEventListener('input', () => this.updateParameterDisplays());
        });
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

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.uploadZone.innerHTML = `
                <img src="${e.target.result}" style="max-width: 100%; max-height: 300px; border-radius: 10px;">
                <p class="mt-3 text-white">File loaded: ${file.name}</p>
                <p class="text-white-50">Click "Apply Embroidery Effect" to process</p>
            `;
        };
        reader.readAsDataURL(file);
    }

    async processImage() {
        if (!this.currentFile) return;

        // Hide results, show processing
        this.resultsSection.classList.add('d-none');
        this.processingSteps.classList.remove('d-none');
        this.processBtn.disabled = true;

        // Initialize steps display
        const steps = [
            'Loading image...',
            'Quantizing colors (embroidery.sh simulation)...',
            'Applying thread pattern...',
            'Spreading pixels (fraying edges)...',
            'Adding fabric texture...',
            'Applying 3D shading...',
            'Boosting colors...',
            'Complete!'
        ];

        this.stepsContainer.innerHTML = steps.map((step, idx) => `
            <div class="processing-step" id="step-${idx}">
                <i class="bi bi-circle me-2"></i>
                <span>${step}</span>
            </div>
        `).join('');

        // Set up step updater
        window.updateProcessingStep = (idx, name) => {
            // Remove active from all
            document.querySelectorAll('.processing-step').forEach(el => {
                el.classList.remove('active');
                const icon = el.querySelector('i');
                icon.className = 'bi bi-check-circle-fill me-2 text-success';
            });

            // Set active on current
            const currentStep = document.getElementById(`step-${idx}`);
            if (currentStep) {
                currentStep.classList.add('active');
                const icon = currentStep.querySelector('i');
                icon.className = 'bi bi-arrow-right-circle-fill me-2 text-warning';
            }
        };

        try {
            // Load image
            const img = await this.pipeline.loadImage(this.currentFile);

            // Get parameters
            const params = {
                numColors: parseInt(this.numColors.value),
                threadThickness: parseInt(this.threadThickness.value),
                spreadAmount: parseInt(this.spreadAmount.value),
                brightness: parseInt(this.brightness.value)
            };

            // Process
            const result = await this.pipeline.processImage(img, params);

            // Show results
            this.originalImage.src = URL.createObjectURL(this.currentFile);
            this.embroideredImage.src = result;
            this.embroideredImage.dataset.url = result;

            this.processingSteps.classList.add('d-none');
            this.resultsSection.classList.remove('d-none');
            this.processBtn.disabled = false;

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
        link.download = 'embroidered_chart.png';
        link.click();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new UIController();
});
