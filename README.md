# Embroidered Charts Pipeline

A programmatic image-processing pipeline that transforms standard digital charts into embroidered textile art, based on ["Creating Embroidered Charts"](https://aman.bh/blog/2025-12-29-embroidered-charts/) methodology.

![Sample Chart](input_chart.png)

## Overview

This project replicates the embroidery effect entirely through code, using client-side Canvas API to simulate ImageMagick operations. The pipeline transforms flat digital charts into images that look like they were stitched onto fabric with thread.

## Features

- **🎨 Color Quantization**: Reduces images to a limited palette (4-16 colors) to simulate embroidery thread colors
- **🧵 Thread Pattern Simulation**: Creates linear stitch patterns using directional blur
- **✨ Spread/Fraying**: Randomly displaces pixels to break perfect digital edges
- **🧶 Fabric Texture**: Adds vertical grain using Gaussian noise and motion blur
- **📦 3D Shading**: Creates depth with shade maps to simulate raised threads
- **💡 Color Boost**: Restores vibrancy after processing

## The Pipeline

The embroidery effect is achieved through 6 main steps:

### 1. Base Embroidery (Color Quantization)
Reduces the image to a limited color palette using K-means clustering. This simulates the limited thread colors available in real embroidery.

**ImageMagick equivalent:**
```bash
./embroidery.sh -n 8 -p linear -t 3 -g 0 input.png output.png
```

### 2. Spread (Fraying Edges)
Randomly displaces pixels by a small amount to create frayed, organic edges.

**ImageMagick equivalent:**
```bash
magick input.png -spread 2 output.png
```

### 3. Fabric Texture
Generates Gaussian noise, applies vertical motion blur, and blends it using Soft Light mode to simulate fabric weave.

**ImageMagick equivalent:**
```bash
magick input.png \
  \( +clone +noise Gaussian -motion-blur 0x8+90 \
     -colorspace Gray -auto-level \) \
  -compose SoftLight -composite output.png
```

### 4. 3D Shading
Creates a shade map using gradient calculations to simulate lighting on raised threads.

**ImageMagick equivalent:**
```bash
magick input.png \
  \( +clone -colorspace Gray -blur 0x2 \
     -shade 120x55 -auto-level -contrast-stretch 5%x5% \) \
  -compose Overlay -composite output.png
```

### 5. Color Boost
Adjusts brightness and saturation to restore vibrancy lost during processing.

**ImageMagick equivalent:**
```bash
magick input.png -modulate 115,105,100 output.png
```

## How to Use

### Quick Start

1. **Open the application:**
   ```bash
   cd /home/ritesh/chart
   python3 -m http.server 8000
   ```

2. **Visit in browser:**
   ```
   http://localhost:8000
   ```

3. **Upload a chart image** (PNG or JPG)

4. **Adjust parameters:**
   - Number of Colors (4-16)
   - Thread Thickness (1-5)
   - Spread Amount (1-5)
   - Brightness (100-130%)

5. **Click "Apply Embroidery Effect"**

6. **Download your embroidered chart!**

### Files

- `index.html` - Main UI with upload, controls, and results display
- `script.js` - Complete client-side processing pipeline
- `config.json` - Configuration and demo metadata
- `input_chart.png` - Sample chart for testing

## Technical Implementation

### Client-Side Processing

Unlike the original R/ImageMagick implementation, this version runs entirely in the browser using the Canvas API. This makes it:

- **Reproducible**: No server-side dependencies
- **Interactive**: Real-time parameter adjustments
- **Portable**: Works on any modern browser
- **Educational**: All code is visible and documented

### Key Algorithms

**Color Quantization (K-means Clustering)**
```javascript
// Reduces image to N colors using iterative clustering
kMeansClustering(pixels, k, maxIterations = 10)
```

**Spread Effect**
```javascript
// Random pixel displacement for organic edges
applySpread(imageData, amount = 2)
```

**Fabric Texture (Noise + Motion Blur + Blend)**
```javascript
// Vertical grain simulation with Soft Light blending
applyFabricTexture(imageData)
```

**3D Shading (Gradient-based Shade Map)**
```javascript
// Sobel gradients + lighting calculation + Overlay blend
apply3DShading(imageData)
```

**Color Modulation (HSL Adjustment)**
```javascript
// RGB → HSL → adjust → RGB conversion
applyColorBoost(imageData, brightness, saturation)
```

## Methodology

This implementation follows methodology:

1. **Start with a clean chart** - Any ggplot, matplotlib, or chart library output
2. **Apply base embroidery** - Color reduction and thread pattern
3. **Add organic texture** - Spread, noise, and fabric grain
4. **Create depth** - 3D shading with highlights and shadows
5. **Restore color** - Final brightness/saturation boost

### Why This Approach?

> "Why go through the trouble of coding this when there is Photoshop? The answer is always reproducibility. If I built this in Photoshop, every time I updated the dataset or caught a typo in my ggplot code, I would have to re-export the image, open it in Photoshop, and manually rerun an action or apply some filter."
> 
> 

## Best Practices

### For Best Results:

1. **Use large images** - Export charts at 2000x2500px, 300 DPI
2. **Limit colors** - Start with 6-8 thread colors
3. **Avoid gradients** - Use discrete colors only
4. **Adjust font sizes** - Larger fonts work better with the texture
5. **Experiment with parameters** - Each chart is unique

### Color Encoding

Since the pipeline quantizes colors to a limited palette:

- ❌ Don't use color gradients for data encoding
- ✅ Use shapes, textures, or sizes instead
- ✅ Stick to 4-8 distinct colors
- ✅ Choose high-contrast colors

## Credits

- **Original Methodology**: Embroidered Charts technique
- **Embroidery Script**: [Fred Weinhaus](http://www.fmwconcepts.com/imagemagick/embroidery/)
- **Inspiration**: [Reuters cloth patch graphics](https://www.reuters.com/)

## License

This is an educational implementation based on publicly documented techniques. The original embroidery.sh script by Fred Weinhaus has its own license terms.

## Further Reading

- [Blog Post](https://aman.bh/blog/2025-12-29-embroidered-charts/)
- [Fred Weinhaus's ImageMagick Scripts](http://www.fmwconcepts.com/imagemagick/)
- [ImageMagick Documentation](https://imagemagick.org/)
- [Nicola Rennie on Monochrome Dataviz](https://nrennie.rbind.io/)

---

**Note**: This is a client-side simulation of the ImageMagick pipeline. For production use with the actual embroidery.sh script, see [GitHub repository](https://github.com/thedivtagguy/word-games-analysis/).
